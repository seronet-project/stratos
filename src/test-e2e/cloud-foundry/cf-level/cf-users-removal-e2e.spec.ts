import { CfTopLevelPage } from './cf-top-level-page.po';
import { CfUserRemovalTestLevel, setupCfUserRemovalTests, CfRolesRemovalLevel } from '../users-removal-e2e.helper';

describe('CF - Remove user roles (only spaces)', () => {
  setupCfUserRemovalTests(CfUserRemovalTestLevel.Cf, CfRolesRemovalLevel.Spaces, (cfGuid) => {
    const cfPage = CfTopLevelPage.forEndpoint(cfGuid);
    cfPage.navigateTo();
    cfPage.waitForPageOrChildPage();
    cfPage.loadingIndicator.waitUntilNotShown();
    return cfPage.goToUsersTab();
  });
});

describe('CF - Remove user roles (only orgs / spaces already gone)', () => {
  setupCfUserRemovalTests(CfUserRemovalTestLevel.Cf, CfRolesRemovalLevel.OrgsSpaces, (cfGuid) => {
    const cfPage = CfTopLevelPage.forEndpoint(cfGuid);
    cfPage.navigateTo();
    cfPage.waitForPageOrChildPage();
    cfPage.loadingIndicator.waitUntilNotShown();
    return cfPage.goToUsersTab();
  });
});
