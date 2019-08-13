import { browser, by, element, promise, protractor } from 'protractor';

import { E2EHelpers } from '../helpers/e2e-helpers';
import { BreadcrumbsComponent } from './breadcrumbs.po';
import { LoadingIndicatorComponent } from './loading-indicator.po';
import { PageHeaderSubPo } from './page-header-sub.po';
import { PageHeader } from './page-header.po';
import { PageTabsPo } from './page-tabs.po';
import { SideNavigation } from './side-nav.po';


const until = protractor.ExpectedConditions;

/**
 * Base Page Object can be inherited by appropriate pages
 */
export abstract class Page {

  // Side navigation
  public sideNav = new SideNavigation();

  // Top header bar (if present)
  public header = new PageHeader();

  // Subheader (if present)
  public subHeader = new PageHeaderSubPo();

  // Tabs (if present)
  public tabs = new PageTabsPo();

  // Breadcrumbs (if present)
  public breadcrumbs = new BreadcrumbsComponent();

  // Loading page indicator (if present)
  public loadingIndicator = new LoadingIndicatorComponent();

  // Helpers
  public helpers = new E2EHelpers();

  constructor(public navLink?: string) { }

  navigateTo(): promise.Promise<any> {
    return browser.get(this.navLink);
  }

  isActivePage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => url === this.getUrl());
  }

  isActivePageOrChildPage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url.startsWith(this.getUrl());
    });
  }

  isChildPage(childPath: string): promise.Promise<boolean> {
    if (!childPath.startsWith('/')) {
      childPath = '/' + childPath;
    }
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + this.navLink + childPath;
    });
  }

  waitForPage(timeout = 20000) {
    expect(this.navLink.startsWith('/')).toBeTruthy('navLink should start with a /');
    return browser.wait(until.urlIs(this.getUrl()), timeout, `Failed to wait for page with navlink '${this.navLink}'`);
  }

  waitForPageDataLoaded(timeout = 20000) {
    this.waitForPage();
    return browser.wait(until.stalenessOf(element(by.tagName('app-loading-page'))), timeout);
  }

  waitForPageOrChildPage() {
    expect(this.navLink.startsWith('/')).toBeTruthy();
    browser.wait(until.urlContains(this.getUrl()), 20000);
  }

  waitForChildPage(childPath: string) {
    expect(this.navLink.startsWith('/')).toBeTruthy();
    browser.wait(until.urlContains(browser.baseUrl + this.navLink + childPath), 20000);
  }
  private getUrl = () => browser.baseUrl + this.navLink;
}
