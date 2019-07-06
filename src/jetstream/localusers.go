package main

import (
	"errors"

	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

func (p *portalProxy) FindUserGUID(c echo.Context) (string, error) {
	username := c.FormValue("username")

	if len(username) == 0 {
		return "", errors.New("Needs username")
	}

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for local users: %v", err)
		return "", err
	}

	guid, err := localUsersRepo.FindUserGUID(username)
	if err != nil {
		log.Errorf("Error finding user GUID %v", err)
		return "", err
	}

	return guid, nil
}

func (p *portalProxy) AddLocalUser(c echo.Context) (string, error) {
	log.Debug("AddLocalUser")

	username := c.FormValue("username")
	password := c.FormValue("password")
	scope    := c.FormValue("scope")
	email    := c.FormValue("email")

	if len(username) == 0 || len(password) == 0 || len(scope) == 0 {
		return "", errors.New("Needs username, password and scope")
	}
	
	//Generate a user GUID and hash the password
	userGUID := uuid.NewV4().String()
	passwordHash, err := HashPassword(password)
	if err != nil {
		log.Errorf("Error hashing user password: %v", err)
		return "", err
	}

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for local users: %v", err)
	} else {
		user := interfaces.LocalUser{UserGUID: userGUID, PasswordHash: passwordHash, Username: username, Email: email, Scope: scope}
		err = localUsersRepo.AddLocalUser(user)
		if err != nil {
			log.Errorf("Error adding local user %v", err)
			return "", err
		}		
	}
	return userGUID, nil
}