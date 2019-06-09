import { browser, promise } from 'protractor';

import { CFPage } from '../../po/cf-page.po';
import { ConfirmDialogComponent } from '../../po/confirm-dialog';
import { ListComponent } from '../../po/list.po';
import { MetaCard } from '../../po/meta-card.po';


export class CfOrgLevelPage extends CFPage {
  static forEndpoint(guid: string, orgGuid): CfOrgLevelPage {
    const page = new CfOrgLevelPage();
    page.navLink = '/cloud-foundry/' + guid + '/organizations/' + orgGuid;
    return page;
  }

  // Detect from the URL
  public static detect(): promise.Promise<CfOrgLevelPage> {
    return browser.getCurrentUrl().then(url => {
      if (url.indexOf(browser.baseUrl) === 0) {
        url = url.substr(browser.baseUrl.length + 1);
      }
      const urlParts = url.split('/');
      expect(urlParts.length).toBe(5);
      expect(urlParts[0]).toBe('cloud-foundry');
      expect(urlParts[2]).toBe('organizations');
      const cfGuid = urlParts[1];
      const orgGuid = urlParts[3];
      return CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
    });
  }

  goToSummaryTab() {
    return this.goToTab('Summary', 'summary');
  }

  goToSpacesTab() {
    return this.goToTab('Spaces', 'spaces');
  }

  goToUsersTab() {
    return this.goToTab('Users', 'users');
  }

  clickOnSpace(spaceName: string) {
    const list = new ListComponent();
    list.cards.findCardByTitle(spaceName).then((card) => {
      expect(card).toBeDefined();
      card.click();
    });
  }

  deleteSpace(spaceName: string) {
    const cardView = new ListComponent();
    cardView.cards.waitUntilShown();

    cardView.cards.findCardByTitle(spaceName).then((card: MetaCard) => {
      card.openActionMenu().then(menu => {
        menu.clickItem('Delete');
        ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Space', spaceName);
        card.waitUntilNotShown();
      });
    });
  }

  private goToTab(label: string, urlSuffix: string) {
    return this.tabs.goToItemAndWait(label, this.navLink, urlSuffix);
  }

}
