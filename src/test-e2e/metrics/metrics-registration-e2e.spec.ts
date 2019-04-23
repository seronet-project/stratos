import { e2e } from '../e2e';
import { EndpointMetadata, EndpointsPage } from '../endpoints/endpoints.po';
import { RegisterStepper } from '../endpoints/register-dialog.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavMenuItem } from '../po/side-nav.po';
import { TileSelector } from '../po/tile-selector.po';

describe('Metrics', () => {

  const endpointsPage = new EndpointsPage();
  const register = new RegisterStepper();
  const tileSelector = new TileSelector();

  beforeAll(() => {
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .getInfo();
  });

  it('Should be able to register a Metrics endpoint', () => {
    endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
    endpointsPage.register();
    tileSelector.select('Metrics');
    expect(register.isRegisterDialog()).toBeTruthy();
    expect(register.stepper.canNext()).toBeFalsy();

    register.form.getControlsMap().then(fields => {
      expect(fields.client_id).toBeUndefined();
      expect(fields.client_secret).toBeUndefined();
    });

    register.form.fill({
      name: 'MetricsTest',
      url: 'https://www.google.com',
      skipsll: false
    });

    register.form.getControlsMap().then(fields => {
      expect(fields.client_id).not.toBeDefined();
      expect(fields.client_secret).not.toBeDefined();
    });

    expect(register.stepper.canNext()).toBeTruthy();
    register.stepper.next();
    register.stepper.next();
    expect(register.isRegisterDialog()).toBeFalsy();

    // Check that we have one row
    expect(endpointsPage.isActivePage()).toBeTruthy();
    expect(endpointsPage.cards.isPresent()).toBeTruthy();

    expect(endpointsPage.cards.getCardCount()).toBe(1);
    endpointsPage.cards.getEndpointDataForEndpoint('MetricsTest', 'Metrics').then((data: EndpointMetadata) => {
      expect(data.name).toEqual('MetricsTest');
      expect(data.url).toEqual('https://www.google.com');
      expect(data.connected).toBeFalsy();
    });
  });
});


