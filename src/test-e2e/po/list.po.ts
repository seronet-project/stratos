import { browser, by, element, Key, promise, protractor } from 'protractor';
import { ElementArrayFinder, ElementFinder } from 'protractor/built';

import { Component } from './component.po';
import { FormComponent } from './form.po';
import { MenuComponent } from './menu.po';
import { MetaCard, MetaCardTitleType } from './meta-card.po';

const until = protractor.ExpectedConditions;

export interface CardMetadata {
  index: number;
  title: string;
  click: Function;
}

// Page Object for the List Table View
export class ListTableComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  getHeaderText(): promise.Promise<string> {
    return this.locator.element(by.css('.list-component__header__left--text')).getText();
  }

  getRows(): ElementArrayFinder {
    return this.locator.all(by.css('.app-table__row'));
  }

  getCell(row, column): ElementFinder {
    return this.getRows().get(row).all(by.css('.app-table__cell')).get(column);
  }

  // Get the data in the table
  getTableDataRaw(): promise.Promise<any> {
    const getHeaders = this.locator.all(by.css('.app-table__header-cell')).map(headerCell => headerCell.getText());
    const getRows = this.locator.all(by.css('.app-table__row')).map(row => row.all(by.css('.app-table__cell')).map(cell => cell.getText()));
    return promise.all([getHeaders, getRows]).then(([headers, rows]) => {
      return {
        headers,
        rows
      };
    });
  }

  getTableData(): promise.Promise<{ [columnHeader: string]: string }[]> {
    return this.getTableDataRaw().then(tableData => {
      const table = [];
      tableData.rows.forEach((row: string[]) => {
        const tableRow = {};
        row.forEach((cellValue, index) => {
          const headerName = (tableData.headers[index] || 'column-' + index) as string;
          tableRow[headerName.toLowerCase()] = cellValue;
        });
        table.push(tableRow);
      });
      return table;
    });
  }

  selectRow(index: number, radioButton = true): promise.Promise<any> {
    return this.locator.all(by.css('.app-table__row')).then(rows => {
      expect(rows.length).toBeGreaterThan(index);
      return rows[index].element(by.css(radioButton ? '.mat-radio-button' : '.mat-checkbox')).click();
    });
  }

  waitUntilNotBusy() {
    return Component.waitUntilNotShown(
      this.locator.element(by.css('.table-row__deletion-bar-wrapper'))
    ).then(() => Component.waitUntilNotShown(
      this.locator.element(by.css('.table-row-wrapper__blocked'))
    ));
  }

  getHighlightedRow(): promise.Promise<number> {
    return this.locator.all(by.css('.app-table__row'))
      .map((row, index) => row.getAttribute('class').then(classes => classes.indexOf('table-row-wrapper__highlighted')))
      .then(isHighlighted => {
        return promise.all(isHighlighted);
      })
      .then(isHighlighted => {
        for (let i = 0; i < isHighlighted.length; i++) {
          if (isHighlighted[i]) {
            return i;
          }
        }
        return -1;
      });
  }

  openRowActionMenuByIndex(index: number): MenuComponent {
    return this.openRowActionMenuByRow(this.getRows().get(index));
  }

  openRowActionMenuByRow(row: ElementFinder): MenuComponent {
    row.element(by.css('app-table-cell-actions button')).click();
    return new MenuComponent();
  }

  toggleSort(headerTitle: string): promise.Promise<any> {
    return this.locator.element(by.cssContainingText('mat-header-row app-table-cell', headerTitle)).click();
  }
}

// Page Object for the List Card View
export class ListCardComponent extends Component {

  static cardsCss = 'app-card:not(.row-filler)';

  constructor(locator: ElementFinder, private header: ListHeaderComponent) {
    super(locator);
  }

  getCardCount() {
    const noRows = this.locator.all(by.css('.no-rows'));
    return noRows.count().then(rows => {
      return rows === 1 ? 0 : this.getCards().count();
    });
  }

  getCards(): ElementArrayFinder {
    return this.locator.all(by.css(ListCardComponent.cardsCss));
  }

  getCard(index: number, metaType = MetaCardTitleType.CUSTOM): MetaCard {
    return new MetaCard(this.getCards().get(index), metaType);
  }

  private findCardElementByTitle(title: string, metaType = MetaCardTitleType.CUSTOM): ElementFinder {
    const card = this.locator.all(by.cssContainingText(`${ListCardComponent.cardsCss} ${metaType}`, title)).filter(elem =>
      elem.getText().then(text => text === title)
    ).first();
    browser.wait(until.presenceOf(card));
    return card.element(by.xpath('ancestor::app-card'));
  }

  waitForCardByTitle(title: string, metaType = MetaCardTitleType.CUSTOM): promise.Promise<MetaCard> {
    const cardElement = this.findCardElementByTitle(title, metaType);
    return browser.wait(until.visibilityOf(cardElement), 10000).then(() => {
      // We've found the title, now get the actual element
      return new MetaCard(cardElement, metaType);
    });
  }

  findCardByTitle(title: string, metaType = MetaCardTitleType.CUSTOM, filter = false): promise.Promise<MetaCard> {
    if (filter) {
      this.header.waitUntilShown();
      this.header.setSearchText(title);
      return this.waitForCardByTitle(title, metaType);
    }

    const cardElement = this.findCardElementByTitle(title, metaType);
    return cardElement.isPresent().then(isPresent => {
      expect(isPresent).toBeTruthy();
      return Promise.resolve(new MetaCard(cardElement, metaType));
    });
  }

  getCardsMetadata(): promise.Promise<CardMetadata[]> {
    return this.getCards().map((elem, index) => {
      return {
        index: index,
        title: elem.element(by.css('.meta-card__title')).getText(),
        click: elem.click,
      };
    });
  }

}
// List Header (filter/search bar)
export class ListHeaderComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator.element(by.css('.list-component__header')));
  }

  getFilterFormField(): ElementArrayFinder {
    return this.locator
      .element(by.css('.list-component__header__left--multi-filters'))
      .all(by.tagName('mat-form-field'));
  }

  getRightHeaderSection(): ElementFinder {
    return this.locator.element(by.css('.list-component__header__right'));
  }

  getLeftHeaderSection(): ElementFinder {
    return this.locator.element(by.css('.list-component__header__left'));
  }

  getSearchInputField(): ElementFinder {
    return this.getRightHeaderSection().all(by.css('.filter')).first().element(by.css('input'));
  }

  setSearchText(text: string): promise.Promise<void> {
    const searchField = this.getSearchInputField();
    searchField.click();
    searchField.clear();
    return searchField.sendKeys(text);
  }

  clearSearchText() {
    const searchField = this.getSearchInputField();
    searchField.click();
    searchField.clear();
    searchField.sendKeys('a');
    searchField.sendKeys(Key.BACK_SPACE);
  }

  getSearchText(): promise.Promise<string> {
    return this.getSearchInputField().getAttribute('value');
  }
  getPlaceholderText(index = 0): promise.Promise<string> {
    return this.getFilterFormField().get(index).element(by.tagName('mat-placeholder')).getText();
  }

  getFilterOptions(index = 0): promise.Promise<ElementFinder[]> {
    this.getFilterFormField().get(index).click();
    return element.all(by.tagName('mat-option')).then((matOptions: ElementFinder[]) => {
      return matOptions;
    });
  }

  getFilterText(index = 0): promise.Promise<string> {
    return this.getFilterFormField().get(index).element(by.css('.mat-select-value')).getText();
  }

  selectFilterOption(index: number, valueIndex): promise.Promise<any> {
    return this.getFilterOptions(index).then(options => options[valueIndex].click());
  }

  getMultiFilterForm(): FormComponent {
    return new FormComponent(this.locator.element(by.className('list-component__header__left--multi-filters')));
  }

  getRefreshListButton(): ElementFinder {
    return this.getRightHeaderSection().element(by.css('#app-list-refresh-button'));
  }

  getCardListViewToggleButton(): ElementFinder {
    return this.getRightHeaderSection().element(by.css('#list-card-toggle'));
  }

  private findSortSection(): ElementFinder {
    return this.locator.element(by.css('.list-component__header__right .sort'));
  }

  getSortFieldForm(): FormComponent {
    return new FormComponent(this.findSortSection());
  }

  toggleSortOrder() {
    this.findSortSection().element(by.css('button')).click();
  }

  getAdd(): ElementFinder {
    return this.locator.element(by.cssContainingText('.list-component__header__right button mat-icon', 'add'));
  }

  getIconButton(iconText: string): ElementFinder {
    return this.getLeftHeaderSection().element(by.cssContainingText('button mat-icon', iconText));
  }

}

export class ListPaginationComponent extends Component {
  constructor(listComponent: ElementFinder) {
    super(listComponent.element(by.tagName('.list-component__paginator')));
  }

  getTotalResults() {
    return this.locator.element(by.css('.mat-paginator-range-label')).getText().then(label => {
      const index = label.indexOf('of ');
      if (index > 0) {
        const value = label.substr(index + 3).trim();
        return parseInt(value, 10);
      }
      return -1;
    });
  }

  private findPageSizeSection(): ElementFinder {
    return this.locator.element(by.css('.mat-paginator-page-size'));
  }

  getPageSize(customCtrlName?: string): promise.Promise<string> {
    return this.getPageSizeForm().getText(customCtrlName || 'mat-select-1');
  }

  setPageSize(pageSize, customCtrlName?: string): promise.Promise<void> {
    const name = customCtrlName || 'mat-select-1';
    return this.getPageSizeForm().fill({ [name]: pageSize });
  }

  getPageSizeForm(): FormComponent {
    return new FormComponent(this.findPageSizeSection());
  }

  getNavFirstPage(): Component {
    return new Component(this.locator.element(by.css('.mat-paginator-navigation-first')));
  }

  getNavLastPage(): Component {
    return new Component(this.locator.element(by.css('.mat-paginator-navigation-last')));
  }

  getNavPreviousPage(): Component {
    return new Component(this.locator.element(by.css('.mat-paginator-navigation-previous')));
  }

  getNavNextPage(): Component {
    return new Component(this.locator.element(by.css('.mat-paginator-navigation-next')));
  }

}

export class ListEmptyComponent extends Component {
  constructor(listComponent: ElementFinder) {
    super(listComponent.element(by.css('.list-component__no-entries')));
  }

  getDefault(): Component {
    return new Component(element(by.css('.list-component__default-no-entries')));
  }

  getCustom(): Component {
    return new Component(element(by.css('app-no-content-message')));
  }

  getCustomLineOne(): promise.Promise<string> {
    return this.getCustom().getComponent().element(by.css('.first-line')).getText();
  }
}
/**
 * Page Object for the List component
 */
export class ListComponent extends Component {

  public table: ListTableComponent;

  public cards: ListCardComponent;

  public header: ListHeaderComponent;

  public pagination: ListPaginationComponent;

  public empty: ListEmptyComponent;

  constructor(locator: ElementFinder = element(by.tagName('app-list'))) {
    super(locator);
    this.table = new ListTableComponent(locator);
    this.header = new ListHeaderComponent(locator);
    this.cards = new ListCardComponent(locator, this.header);
    this.pagination = new ListPaginationComponent(locator);
    this.empty = new ListEmptyComponent(locator);
  }

  isTableView(): promise.Promise<boolean> {
    const listElement = this.locator.element(by.css('.list-component'));
    return this.hasClass('list-component__table', listElement);
  }

  isCardsView(): promise.Promise<boolean> {
    const listElement = this.locator.element(by.css('.list-component'));
    return this.hasClass('list-component__cards', listElement);
  }

  refresh() {
    this.locator.element(by.id('app-list-refresh-button')).click();
    const refreshIcon = element(by.css('.refresh-icon.refreshing'));
    return browser.wait(until.invisibilityOf(refreshIcon), 10000);
  }

  getTotalResults(): promise.Promise<number> {
    // const paginator = new PaginatorComponent();
    return this.pagination.isDisplayed().then(havePaginator => {
      if (havePaginator) {
        return this.pagination.getTotalResults();
      }
      return this.isCardsView().then(haveCardsView => {
        if (haveCardsView) {
          return this.cards.getCards().count();
        }
        return this.table.getRows().count();
      });
    });
  }

}

