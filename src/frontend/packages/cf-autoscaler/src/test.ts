// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import 'core-js/es7/reflect';
import 'zone.js/dist/zone';
import 'zone.js/dist/zone-testing';

import { APP_BASE_HREF } from '@angular/common';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';


declare const require: any;

// First, initialize the Angular testing environment.
const testBed = getTestBed();
testBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

beforeEach(() => {
  testBed.configureTestingModule({
    providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
  });
});

/**
 * Bump up the Jasmine timeout from 5 seconds
 */
beforeAll(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
});

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
