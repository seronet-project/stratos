import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-helpers';
import { setupInviteUserTests } from '../invite-users-e2e.helper';
import { CfSpaceLevelPage } from './cf-space-level-page.po';

describe('CF - Space - Invite User - ', () => {
  let spacePage: CfSpaceLevelPage;

  const navToSpaceUserList = (cfHelper: CFHelpers, defaultCf: E2EConfigCloudFoundry) => {
    return cfHelper.navFromCfToOrg(defaultCf.testOrg)
      .then(orgPage => cfHelper.navFromOrgToSpace(orgPage, defaultCf.testSpace))
      .then(s => {
        spacePage = s;
        return s.goToUsersTab();
      });
  };

  const navToCfSummary = () => spacePage.breadcrumbs.getBreadcrumbs().then(breadcrumbs => breadcrumbs[0].click());

  setupInviteUserTests(true, navToSpaceUserList, navToCfSummary);

});
