package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
)

// LoginHookFunc - function that can be hooked into a successful user login
type LoginHookFunc func(c echo.Context) error

// UAAAdminIdentifier - The identifier that UAA uses to convey administrative level perms
const UAAAdminIdentifier = "stratos.admin"

// CFAdminIdentifier - The scope that Cloud Foundry uses to convey administrative level perms
const CFAdminIdentifier = "cloud_controller.admin"

// SessionExpiresOnHeader Custom header for communicating the session expiry time to clients
const SessionExpiresOnHeader = "X-Cap-Session-Expires-On"

// ClientRequestDateHeader Custom header for getting date form client
const ClientRequestDateHeader = "X-Cap-Request-Date"

// XSRFTokenHeader - XSRF Token Header name
const XSRFTokenHeader = "X-Xsrf-Token"

// XSRFTokenCookie - XSRF Token Cookie name
const XSRFTokenCookie = "XSRF-TOKEN"

// XSRFTokenSessionName - XSRF Token Session name
const XSRFTokenSessionName = "xsrf_token"

type LogoutResponse struct {
	IsSSO bool `json:"isSSO"`
}

func (p *portalProxy) getUAAIdentityEndpoint() string {
	log.Debug("getUAAIdentityEndpoint")
	return fmt.Sprintf("%s/oauth/token", p.Config.ConsoleConfig.UAAEndpoint)
}

func (p *portalProxy) removeEmptyCookie(c echo.Context) {
	req := c.Request()
	originalCookie := req.Header.Get("Cookie")
	cleanCookie := p.EmptyCookieMatcher.ReplaceAllLiteralString(originalCookie, "")
	req.Header.Set("Cookie", cleanCookie)
}

// Get the user name for the specified user
func (p *portalProxy) GetUsername(userid string) (string, error) {
	tr, err := p.GetUAATokenRecord(userid)
	if err != nil {
		return "", err
	}

	u, userTokenErr := p.GetUserTokenInfo(tr.AuthToken)
	if userTokenErr != nil {
		return "", userTokenErr
	}

	return u.UserName, nil
}

// Login via UAA
func (p *portalProxy) initSSOlogin(c echo.Context) error {
	if !p.Config.SSOLogin {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"SSO Login is not enabled",
			"SSO Login is not enabled")
		return err
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	redirectURL := fmt.Sprintf("%s/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s", p.Config.ConsoleConfig.UAAEndpoint, p.Config.ConsoleConfig.ConsoleClient, url.QueryEscape(getSSORedirectURI(state, state, "")))
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
	return nil
}

func getSSORedirectURI(base string, state string, endpointGUID string) string {
	baseURL, _ := url.Parse(base)
	baseURL.Path = ""
	baseURL.RawQuery = ""
	baseURLString := strings.TrimRight(baseURL.String(), "?")

	returnURL := fmt.Sprintf("%s/pp/v1/auth/sso_login_callback?state=%s", baseURLString, url.QueryEscape(state))
	if len(endpointGUID) > 0 {
		returnURL = fmt.Sprintf("%s&guid=%s", returnURL, endpointGUID)
	}
	return returnURL
}

// Logout of the UAA
func (p *portalProxy) ssoLogoutOfUAA(c echo.Context) error {
	if !p.Config.SSOLogin {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"SSO Login is not enabled",
			"SSO Login is not enabled")
		return err
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	// Redirect to the UAA to logout of the UAA session as well (if configured to do so), otherwise redirect back to the UI login page
	var redirectURL string
	if p.hasSSOOption("logout") {
		redirectURL = fmt.Sprintf("%s/logout.do?client_id=%s&redirect=%s", p.Config.ConsoleConfig.UAAEndpoint, p.Config.ConsoleConfig.ConsoleClient, url.QueryEscape(getSSORedirectURI(state, "logout", "")))
	} else {
		redirectURL = "/login?SSO_Message=You+have+been+logged+out"
	}
	return c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (p *portalProxy) hasSSOOption(option string) bool {
	// Remove all spaces
	opts := RemoveSpaces(p.Config.SSOOptions)

	// Split based on ','
	options := strings.Split(opts, ",")
	return ArrayContainsString(options, option)
}

// Callback - invoked after the UAA login flow has completed and during logout
// We use a single callback so this can be whitelisted in the client
func (p *portalProxy) ssoLoginToUAA(c echo.Context) error {
	state := c.QueryParam("state")
	if len(state) == 0 {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	// We use the same callback URL for both UAA and endpoint login
	// Check if it is an endpoint login and dens to the right handler
	endpointGUID := c.QueryParam("guid")
	if len(endpointGUID) > 0 {
		return p.ssoLoginToCNSI(c)
	}

	if state == "logout" {
		return c.Redirect(http.StatusTemporaryRedirect, "/login?SSO_Message=You+have+been+logged+out")
	}
	_, err := p.doLoginToUAA(c)
	if err != nil {
		// Send error as query string param
		msg := err.Error()
		if httpError, ok := err.(interfaces.ErrHTTPShadow); ok {
			msg = httpError.UserFacingError
		}
		if httpError, ok := err.(interfaces.ErrHTTPRequest); ok {
			msg = httpError.Response
		}
		state = fmt.Sprintf("%s/login?SSO_Message=%s", state, url.QueryEscape(msg))
	}

	return c.Redirect(http.StatusTemporaryRedirect, state)
}

func (p *portalProxy) loginToUAA(c echo.Context) error {
	log.Debug("loginToUAA")
	resp, err := p.doLoginToUAA(c)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	// Add XSRF Token
	p.ensureXSRFToken(c)

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func (p *portalProxy) doLoginToUAA(c echo.Context) (*interfaces.LoginRes, error) {
	log.Debug("doLoginToUAA")
	uaaRes, u, err := p.login(c, p.Config.ConsoleConfig.SkipSSLValidation, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
	if err != nil {
		// Check the Error
		errMessage := "Access Denied"
		if httpError, ok := err.(interfaces.ErrHTTPRequest); ok {
			// Try and parse the Response into UAA error structure
			authError := &interfaces.UAAErrorResponse{}
			if err := json.Unmarshal([]byte(httpError.Response), authError); err == nil {
				errMessage = authError.ErrorDescription
			}
		}

		err = interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			errMessage,
			"UAA Login failed: %s: %v", errMessage, err)
		return nil, err
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = u.UserGUID
	sessionValues["exp"] = u.TokenExpiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = p.setSessionValues(c, sessionValues); err != nil {
		return nil, err
	}

	err = p.handleSessionExpiryHeader(c)
	if err != nil {
		return nil, err
	}

	_, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return nil, err
	}

	err = p.ExecuteLoginHooks(c)
	if err != nil {
		log.Warnf("Login hooks failed: %v", err)
	}

	uaaAdmin := strings.Contains(uaaRes.Scope, p.Config.ConsoleConfig.ConsoleAdminScope)
	resp := &interfaces.LoginRes{
		Account:     u.UserName,
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: nil,
		Admin:       uaaAdmin,
	}
	return resp, nil
}

// Start SSO flow for an Endpoint
func (p *portalProxy) ssoLoginToCNSI(c echo.Context) error {
	log.Debug("ssoLoginToCNSI")
	endpointGUID := c.QueryParam("guid")
	if len(endpointGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	_, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", endpointGUID, err)
	}

	// Check if this is first time in the flow, or via the callback
	code := c.QueryParam("code")

	if len(code) == 0 {
		// First time around
		// Use the standard SSO Login Callback endpoint, so this can be whitelisted for Stratos and Endpoint login
		returnURL := getSSORedirectURI(state, state, endpointGUID)
		redirectURL := fmt.Sprintf("%s/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s",
			cnsiRecord.AuthorizationEndpoint, cnsiRecord.ClientId, url.QueryEscape(returnURL))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return nil
	}

	// Callback
	_, err = p.DoLoginToCNSI(c, endpointGUID, false)
	status := "ok"
	if err != nil {
		status = "fail"
	}

	// Take the user back to Stratos on the endpoints page
	redirect := fmt.Sprintf("/endpoints?cnsi_guid=%s&status=%s", endpointGUID, status)
	c.Redirect(http.StatusTemporaryRedirect, redirect)
	return nil
}

// Connect to the given Endpoint
// Note, an admin user can connect an endpoint as a system endpoint to share it with others
func (p *portalProxy) loginToCNSI(c echo.Context) error {
	log.Debug("loginToCNSI")
	cnsiGuid := c.FormValue("cnsi_guid")
	var systemSharedToken = false

	if len(cnsiGuid) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	systemSharedValue := c.FormValue("system_shared")
	if len(systemSharedValue) > 0 {
		systemSharedToken = systemSharedValue == "true"
	}

	resp, err := p.DoLoginToCNSI(c, cnsiGuid, systemSharedToken)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*interfaces.LoginRes, error) {

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", cnsiGUID, err)
	}

	// Get the User ID since we save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	// Register as a system endpoint?
	if systemSharedToken {
		// User needs to be an admin
		user, err := p.GetUAAUser(userID)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect System Shared endpoint - could not check user")
		}

		if !user.Admin {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect System Shared endpoint - user is not an administrator")
		}

		// We are all good to go - change the userID, so we record this token against the system-shared user and not this specific user
		// This is how we identify system-shared endpoint tokens
		userID = tokens.SystemSharedUserGuid
	}

	// Ask the endpoint type to connect
	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}

		endpointType := endpointPlugin.GetType()
		if cnsiRecord.CNSIType == endpointType {
			tokenRecord, isAdmin, err := endpointPlugin.Connect(c, cnsiRecord, userID)
			if err != nil {
				if shadowError, ok := err.(interfaces.ErrHTTPShadow); ok {
					return nil, shadowError
				}
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the endpoint",
					"Could not connect to the endpoint: %s", err)
			}

			err = p.setCNSITokenRecord(cnsiGUID, userID, *tokenRecord)
			if err != nil {
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Failed to save Token for endpoint",
					"Error occurred: %s", err)
			}

			// Validate the connection - some endpoints may want to validate that the connected endpoint
			err = endpointPlugin.Validate(userID, cnsiRecord, *tokenRecord)
			if err != nil {
				// Clear the token
				p.ClearCNSIToken(cnsiRecord, userID)
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the endpoint",
					"Could not connect to the endpoint: %s", err)
			}

			resp := &interfaces.LoginRes{
				Account:     userID,
				TokenExpiry: tokenRecord.TokenExpiry,
				APIEndpoint: cnsiRecord.APIEndpoint,
				Admin:       isAdmin,
			}

			cnsiUser, ok := p.GetCNSIUserFromToken(cnsiGUID, tokenRecord)
			if ok {
				// If this is a system shared endpoint, then remove some metadata that should be send back to other users
				santizeInfoForSystemSharedTokenUser(cnsiUser, systemSharedToken)
				resp.User = cnsiUser
			} else {
				// Need to record a user
				resp.User = &interfaces.ConnectedUser{
					GUID:   "Unknown",
					Name:   "Unknown",
					Scopes: []string{"read"},
					Admin:  true,
				}
			}

			return resp, nil
		}
	}

	return nil, interfaces.NewHTTPShadowError(
		http.StatusBadRequest,
		"Endpoint connection not supported",
		"Endpoint connection not supported")
}

func (p *portalProxy) DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord interfaces.CNSIRecord) error {
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("could not find correct session value")
	}
	uaaToken, err := p.GetUAATokenRecord(userID)
	if err == nil { // Found the user's UAA token
		u, err := p.GetUserTokenInfo(uaaToken.AuthToken)
		if err != nil {
			return errors.New("could not parse current user UAA token")
		}
		cfEndpointSpec, _ := p.GetEndpointTypeSpec("cf")
		cnsiInfo, _, err := cfEndpointSpec.Info(theCNSIrecord.APIEndpoint.String(), true)
		if err != nil {
			log.Fatal("Could not get the info for Cloud Foundry", err)
			return err
		}

		uaaUrl, err := url.Parse(cnsiInfo.AuthorizationEndpoint)
		if err != nil {
			return fmt.Errorf("invalid authorization endpoint URL %s %s", cnsiInfo.AuthorizationEndpoint, err)
		}

		if uaaUrl.String() == p.GetConfig().ConsoleConfig.UAAEndpoint.String() { // CNSI UAA server matches Console UAA server
			uaaToken.LinkedGUID = uaaToken.TokenGUID
			err = p.setCNSITokenRecord(theCNSIrecord.GUID, u.UserGUID, uaaToken)

			// Update the endpoint to indicate that SSO Login is okay
			repo, dbErr := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
			if dbErr == nil {
				repo.Update(theCNSIrecord.GUID, true)
			}
			// Return error from the login
			return err
		} else {
			return fmt.Errorf("the auto-registered endpoint UAA server does not match console UAA server")
		}
	} else {
		log.Warn("Could not find current user UAA token")
		return err
	}
}

func santizeInfoForSystemSharedTokenUser(cnsiUser *interfaces.ConnectedUser, isSysystemShared bool) {
	if isSysystemShared {
		cnsiUser.GUID = tokens.SystemSharedUserGuid
		cnsiUser.Scopes = make([]string, 0)
		cnsiUser.Name = "system_shared"
	}
}

func (p *portalProxy) ConnectOAuth2(c echo.Context, cnsiRecord interfaces.CNSIRecord) (*interfaces.TokenRecord, error) {
	uaaRes, u, _, err := p.FetchOAuth2Token(cnsiRecord, c)
	if err != nil {
		return nil, err
	}
	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, false)
	return &tokenRecord, nil
}

func (p *portalProxy) fetchHttpBasicToken(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*interfaces.UAAResponse, *interfaces.JWTUserTokenInfo, *interfaces.CNSIRecord, error) {

	uaaRes, u, err := p.loginHttpBasic(c)

	if err != nil {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

func (p *portalProxy) FetchOAuth2Token(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*interfaces.UAAResponse, *interfaces.JWTUserTokenInfo, *interfaces.CNSIRecord, error) {
	endpoint := cnsiRecord.AuthorizationEndpoint

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)

	uaaRes, u, err := p.login(c, cnsiRecord.SkipSSLValidation, cnsiRecord.ClientId, cnsiRecord.ClientSecret, tokenEndpoint)

	if err != nil {
		if httpError, ok := err.(interfaces.ErrHTTPRequest); ok {
			// Try and parse the Response into UAA error structure (p.login only handles UAA requests)
			errMessage := ""
			authError := &interfaces.UAAErrorResponse{}
			if err := json.Unmarshal([]byte(httpError.Response), authError); err == nil {
				errMessage = fmt.Sprintf(": %s", authError.ErrorDescription)
			}
			return nil, nil, nil, interfaces.NewHTTPShadowError(
				httpError.Status,
				fmt.Sprintf("Could not connect to the endpoint%s", errMessage),
				"Could not connect to the endpoint: %s", err)
		}

		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

func (p *portalProxy) logoutOfCNSI(c echo.Context) error {
	log.Debug("logoutOfCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")

	if len(cnsiGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	userGUID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return fmt.Errorf("Could not find correct session value: %s", err)
	}

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return fmt.Errorf("Unable to load CNSI record: %s", err)
	}

	// Get the existing token to see if it is connected as a system shared endpoint
	tr, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if ok && tr.SystemShared {
		// User needs to be an admin
		user, err := p.GetUAAUser(userGUID)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "Can not disconnect System Shared endpoint - could not check user")
		}

		if !user.Admin {
			return echo.NewHTTPError(http.StatusUnauthorized, "Can not disconnect System Shared endpoint - user is not an administrator")
		}
		userGUID = tokens.SystemSharedUserGuid
	}

	// Clear the token
	return p.ClearCNSIToken(cnsiRecord, userGUID)
}

// Clear the CNSI token
func (p *portalProxy) ClearCNSIToken(cnsiRecord interfaces.CNSIRecord, userGUID string) error {
	// If cnsi is cf AND cf is auto-register only clear the entry
	p.Config.AutoRegisterCFUrl = strings.TrimRight(p.Config.AutoRegisterCFUrl, "/")
	if cnsiRecord.CNSIType == "cf" && p.GetConfig().AutoRegisterCFUrl == cnsiRecord.APIEndpoint.String() {
		log.Debug("Setting token record as disconnected")

		tokenRecord := p.InitEndpointTokenRecord(0, "cleared_token", "cleared_token", true)
		if err := p.setCNSITokenRecord(cnsiRecord.GUID, userGUID, tokenRecord); err != nil {
			return fmt.Errorf("Unable to clear token: %s", err)
		}
	} else {
		log.Debug("Deleting Token")
		if err := p.deleteCNSIToken(cnsiRecord.GUID, userGUID); err != nil {
			return fmt.Errorf("Unable to delete token: %s", err)
		}
	}

	return nil
}

func (p *portalProxy) RefreshUAALogin(username, password string, store bool) error {
	log.Debug("RefreshUAALogin")
	uaaRes, err := p.getUAATokenWithCreds(p.Config.ConsoleConfig.SkipSSLValidation, username, password, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
	if err != nil {
		return err
	}

	u, err := p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return err
	}

	if store {
		_, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
		if err != nil {
			return err
		}
	}

	return nil
}

func (p *portalProxy) login(c echo.Context, skipSSLValidation bool, client string, clientSecret string, endpoint string) (uaaRes *interfaces.UAAResponse, u *interfaces.JWTUserTokenInfo, err error) {
	log.Debug("login")
	if c.Request().Method == http.MethodGet {
		code := c.QueryParam("code")
		state := c.QueryParam("state")
		// If this is login for a CNSI, then the redirect URL is slightly different
		cnsiGUID := c.QueryParam("guid")
		uaaRes, err = p.getUAATokenWithAuthorizationCode(skipSSLValidation, code, client, clientSecret, endpoint, state, cnsiGUID)
	} else {
		username := c.FormValue("username")
		password := c.FormValue("password")

		if len(username) == 0 || len(password) == 0 {
			return uaaRes, u, errors.New("Needs username and password")
		}
		uaaRes, err = p.getUAATokenWithCreds(skipSSLValidation, username, password, client, clientSecret, endpoint)
	}
	if err != nil {
		return uaaRes, u, err
	}

	u, err = p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return uaaRes, u, err
	}

	return uaaRes, u, nil
}

func (p *portalProxy) loginHttpBasic(c echo.Context) (uaaRes *interfaces.UAAResponse, u *interfaces.JWTUserTokenInfo, err error) {
	log.Debug("login")
	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return uaaRes, u, errors.New("Needs username and password")
	}

	authString := fmt.Sprintf("%s:%s", username, password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	uaaRes.AccessToken = fmt.Sprintf("Basic %s", base64EncodedAuthString)
	return uaaRes, u, nil
}

func (p *portalProxy) logout(c echo.Context) error {
	log.Debug("logout")

	p.removeEmptyCookie(c)

	// Remove the XSRF Token from the session
	p.unsetSessionValue(c, XSRFTokenSessionName)

	err := p.clearSession(c)
	if err != nil {
		log.Errorf("Unable to clear session: %v", err)
	}

	// Send JSON document
	resp := &LogoutResponse{
		IsSSO: p.Config.SSOLogin,
	}

	return c.JSON(http.StatusOK, resp)
}

func (p *portalProxy) getUAATokenWithAuthorizationCode(skipSSLValidation bool, code, client, clientSecret, authEndpoint string, state string, cnsiGUID string) (*interfaces.UAAResponse, error) {
	log.Debug("getUAATokenWithAuthorizationCode")

	body := url.Values{}
	body.Set("grant_type", "authorization_code")
	body.Set("code", code)
	body.Set("client_id", client)
	body.Set("client_secret", clientSecret)
	body.Set("redirect_uri", getSSORedirectURI(state, state, cnsiGUID))

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAATokenWithCreds(skipSSLValidation bool, username, password, client, clientSecret, authEndpoint string) (*interfaces.UAAResponse, error) {
	log.Debug("getUAATokenWithCreds")

	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAATokenWithRefreshToken(skipSSLValidation bool, refreshToken, client, clientSecret, authEndpoint string, scopes string) (*interfaces.UAAResponse, error) {
	log.Debug("getUAATokenWithRefreshToken")

	body := url.Values{}
	body.Set("grant_type", "refresh_token")
	body.Set("refresh_token", refreshToken)
	body.Set("response_type", "token")

	if len(scopes) > 0 {
		body.Set("scope", scopes)
	}

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAAToken(body url.Values, skipSSLValidation bool, client, clientSecret, authEndpoint string) (*interfaces.UAAResponse, error) {
	log.WithField("authEndpoint", authEndpoint).Debug("getUAAToken")
	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	req.SetBasicAuth(client, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	var h = p.GetHttpClientForRequest(req, skipSSLValidation)
	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()

	var response interfaces.UAAResponse

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&response); err != nil {
		log.Errorf("Error decoding response: %v", err)
		return nil, fmt.Errorf("getUAAToken Decode: %s", err)
	}

	return &response, nil
}

func (p *portalProxy) saveAuthToken(u interfaces.JWTUserTokenInfo, authTok string, refreshTok string) (interfaces.TokenRecord, error) {
	log.Debug("saveAuthToken")

	key := u.UserGUID
	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
		AuthType:     interfaces.AuthTypeOAuth2,
	}

	err := p.setUAATokenRecord(key, tokenRecord)
	if err != nil {
		return tokenRecord, err
	}

	return tokenRecord, nil
}

// Helper to initialzie a token record using the specified parameters
func (p *portalProxy) InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) interfaces.TokenRecord {
	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  expiry,
		Disconnected: disconnect,
		AuthType:     interfaces.AuthTypeOAuth2,
	}

	return tokenRecord
}

func (p *portalProxy) deleteCNSIToken(cnsiID string, userGUID string) error {
	log.Debug("deleteCNSIToken")

	err := p.unsetCNSITokenRecord(cnsiID, userGUID)
	if err != nil {
		log.Errorf("%v", err)
		return err
	}

	return nil
}

func (p *portalProxy) GetUAATokenRecord(userGUID string) (interfaces.TokenRecord, error) {
	log.Debug("GetUAATokenRecord")

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for UAA token: %v", err)
		return interfaces.TokenRecord{}, err
	}

	tr, err := tokenRepo.FindAuthToken(userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		log.Errorf("Database error finding UAA token: %v", err)
		return interfaces.TokenRecord{}, err
	}

	return tr, nil
}

func (p *portalProxy) setUAATokenRecord(key string, t interfaces.TokenRecord) error {
	log.Debug("setUAATokenRecord")

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("Database error getting repo for UAA token: %v", err)
	}

	err = tokenRepo.SaveAuthToken(key, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return fmt.Errorf("Database error saving UAA token: %v", err)
	}

	return nil
}

func (p *portalProxy) verifySession(c echo.Context) error {
	log.Debug("verifySession")

	sessionExpireTime, err := p.GetSessionInt64Value(c, "exp")
	if err != nil {
		msg := "Could not find session date"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	tr, err := p.GetUAATokenRecord(sessionUser)
	if err != nil {
		msg := fmt.Sprintf("Unable to find UAA Token: %s", err)
		log.Error(msg, err)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	// Check if UAA token has expired
	if time.Now().After(time.Unix(sessionExpireTime, 0)) {

		// UAA Token has expired, refresh the token, if that fails, fail the request
		uaaRes, tokenErr := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, tr.RefreshToken, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint(), "")
		if tokenErr != nil {
			msg := "Could not refresh UAA token"
			log.Error(msg, tokenErr)
			return echo.NewHTTPError(http.StatusForbidden, msg)
		}

		u, userTokenErr := p.GetUserTokenInfo(uaaRes.AccessToken)
		if userTokenErr != nil {
			return userTokenErr
		}

		if _, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken); err != nil {
			return err
		}
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = u.UserGUID
		sessionValues["exp"] = u.TokenExpiry

		if err = p.setSessionValues(c, sessionValues); err != nil {
			return err
		}
	} else {
		// Still need to extend the expires_on of the Session
		if err = p.setSessionValues(c, nil); err != nil {
			return err
		}
	}

	err = p.handleSessionExpiryHeader(c)
	if err != nil {
		return err
	}

	info, err := p.getInfo(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Add XSRF Token
	p.ensureXSRFToken(c)

	err = c.JSON(http.StatusOK, info)
	if err != nil {
		return err
	}

	return nil
}

// Create a token for XSRF if needed, store it in the session and add the response header for the front-end to pick up
func (p *portalProxy) ensureXSRFToken(c echo.Context) {
	token, err := p.GetSessionStringValue(c, XSRFTokenSessionName)
	if err != nil || len(token) == 0 {
		// Need a new token
		tokenBytes, err := generateRandomBytes(32)
		if err == nil {
			token = base64.StdEncoding.EncodeToString(tokenBytes)
		} else {
			token = ""
		}
		sessionValues := make(map[string]interface{})
		sessionValues[XSRFTokenSessionName] = token
		p.setSessionValues(c, sessionValues)
	}

	if len(token) > 0 {
		c.Response().Header().Set(XSRFTokenHeader, token)
	}
}

// See: https://github.com/gorilla/csrf/blob/a8abe8abf66db8f4a9750d76ba95b4021a354757/helpers.go
// generateRandomBytes returns securely generated random bytes.
// It will return an error if the system's secure random number generator fails to function correctly.
func generateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	// err == nil only if len(b) == n
	if err != nil {
		return nil, err
	}

	return b, nil

}

func (p *portalProxy) handleSessionExpiryHeader(c echo.Context) error {

	// Explicitly tell the client when this session will expire. This is needed because browsers actively hide
	// the Set-Cookie header and session cookie expires_on from client side javascript
	expOn, err := p.GetSessionValue(c, "expires_on")
	if err != nil {
		msg := "Could not get session expiry"
		log.Error(msg+" - ", err)
		return echo.NewHTTPError(http.StatusInternalServerError, msg)
	}
	c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(expOn.(time.Time).Unix(), 10))

	expiry := expOn.(time.Time)
	expiryDuration := expiry.Sub(time.Now())

	// Subtract time now to get the duration add this to the time provided by the client
	clientDate := c.Request().Header.Get(ClientRequestDateHeader)
	if len(clientDate) > 0 {
		clientDateInt, err := strconv.ParseInt(clientDate, 10, 64)
		if err == nil {
			clientDateInt += int64(expiryDuration.Seconds())
			c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(clientDateInt, 10))
		}
	}

	return nil
}

func (p *portalProxy) GetUAAUser(userGUID string) (*interfaces.ConnectedUser, error) {
	log.Debug("getUAAUser")

	// get the uaa token record
	uaaTokenRecord, err := p.GetUAATokenRecord(userGUID)
	if err != nil {
		msg := "Unable to retrieve UAA token record."
		log.Error(msg)
		return nil, fmt.Errorf(msg)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := p.GetUserTokenInfo(uaaTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	// is the user a UAA admin?
	uaaAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), p.Config.ConsoleConfig.ConsoleAdminScope)

	// add the uaa entry to the output
	uaaEntry := &interfaces.ConnectedUser{
		GUID:   userGUID,
		Name:   userTokenInfo.UserName,
		Admin:  uaaAdmin,
		Scopes: userTokenInfo.Scope,
	}

	return uaaEntry, nil
}

func (p *portalProxy) GetCNSIUser(cnsiGUID string, userGUID string) (*interfaces.ConnectedUser, bool) {
	user, _, ok := p.GetCNSIUserAndToken(cnsiGUID, userGUID)
	return user, ok
}

func (p *portalProxy) GetCNSIUserAndToken(cnsiGUID string, userGUID string) (*interfaces.ConnectedUser, *interfaces.TokenRecord, bool) {
	log.Debug("GetCNSIUserAndToken")

	// get the uaa token record
	cfTokenRecord, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		msg := "Unable to retrieve CNSI token record."
		log.Debug(msg)
		return nil, nil, false
	}

	cnsiUser, ok := p.GetCNSIUserFromToken(cnsiGUID, &cfTokenRecord)

	// If this is a system shared endpoint, then remove some metadata that should not be send back to other users
	santizeInfoForSystemSharedTokenUser(cnsiUser, cfTokenRecord.SystemShared)

	return cnsiUser, &cfTokenRecord, ok
}

func (p *portalProxy) GetCNSIUserFromToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	log.Debug("GetCNSIUserFromToken")

	// Custom handler for the Auth type available?
	authProvider := p.GetAuthProvider(cfTokenRecord.AuthType)
	if authProvider.UserInfo != nil {
		return authProvider.UserInfo(cnsiGUID, cfTokenRecord)
	}

	// Default
	return p.GetCNSIUserFromOAuthToken(cnsiGUID, cfTokenRecord)
}

func (p *portalProxy) GetCNSIUserFromBasicToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	return &interfaces.ConnectedUser{
		GUID: cfTokenRecord.RefreshToken,
		Name: cfTokenRecord.RefreshToken,
	}, true
}

func (p *portalProxy) GetCNSIUserFromOAuthToken(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	var cnsiUser *interfaces.ConnectedUser
	var scope = []string{}

	// get the scope out of the JWT token data
	userTokenInfo, err := p.GetUserTokenInfo(cfTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the CNSI UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, false
	}

	// add the uaa entry to the output
	cnsiUser = &interfaces.ConnectedUser{
		GUID:   userTokenInfo.UserGUID,
		Name:   userTokenInfo.UserName,
		Scopes: userTokenInfo.Scope,
	}
	scope = userTokenInfo.Scope

	// is the user an CF admin?
	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		msg := "Unable to load CNSI record: %s"
		log.Errorf(msg, err)
		return nil, false
	}
	// TODO should be an extension point
	if cnsiRecord.CNSIType == "cf" {
		cnsiAdmin := strings.Contains(strings.Join(scope, ""), p.Config.CFAdminIdentifier)
		cnsiUser.Admin = cnsiAdmin
	}

	return cnsiUser, true
}

func (p *portalProxy) DoAuthFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request, authHandler interfaces.AuthHandlerFunc) (*http.Response, error) {

	// get a cnsi token record and a cnsi record
	tokenRec, cnsi, err := p.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Endpoint records: %v", err)
	}
	return authHandler(tokenRec, cnsi)
}

// Refresh the UAA Token for the user
func (p *portalProxy) RefreshUAAToken(userGUID string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshUAAToken")

	userToken, err := p.GetUAATokenRecord(userGUID)
	if err != nil {
		return t, fmt.Errorf("UAA Token info could not be found for user with GUID %s", userGUID)
	}

	uaaRes, err := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, userToken.RefreshToken,
		p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint(), "")
	if err != nil {
		return t, fmt.Errorf("UAA Token refresh request failed: %v", err)
	}

	u, err := p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return t, fmt.Errorf("Could not get user token info from access token")
	}

	u.UserGUID = userGUID

	t, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return t, fmt.Errorf("Couldn't save new UAA token: %v", err)
	}

	return t, nil
}
