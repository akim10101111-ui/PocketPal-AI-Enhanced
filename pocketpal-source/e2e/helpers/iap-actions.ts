/**
 * Drives the in-app FakeStore used by the in-app purchase specs.
 *
 * - Android: the hidden IapAdapter (`iap-command-input` / `iap-command-result`),
 *   because the Android Linking listener only routes the benchmark URL.
 * - iOS: the automation deep link pocketpal://iap?cmd=...
 *
 * The verbs are listed in src/__automation__/README.md.
 */

import * as path from 'path';

import {adb as runAdb} from './bench-runner';
import {byTestId} from './selectors';
import {withBridgeElements} from './automation-bridge';
import {IAP_MOCK_PORT} from './iapMockServer';

declare const driver: WebdriverIO.Browser;
declare const browser: WebdriverIO.Browser;

export const IOS_BUNDLE_ID = 'ai.pocketpal';
export const ANDROID_PACKAGE = 'com.pocketpalai.e2e';

export const appId = (): string =>
  driver.isAndroid ? ANDROID_PACKAGE : IOS_BUNDLE_ID;

export const mockBase = (): string => `http://127.0.0.1:${IAP_MOCK_PORT}`;

/** Android devices reach the host mock through adb reverse. */
export const reverseMockPort = (): void => {
  if (driver.isAndroid) {
    runAdb(
      process.env.E2E_DEVICE_UDID,
      'reverse',
      `tcp:${IAP_MOCK_PORT}`,
      `tcp:${IAP_MOCK_PORT}`,
    );
  }
};

export async function iapCommand(command: string): Promise<string> {
  if (driver.isAndroid) {
    return withBridgeElements(async () => {
      const input = await driver.$(byTestId('iap-command-input'));
      await input.waitForExist({timeout: 15000});
      await input.setValue(command);
      await driver.pause(400);
      const result = await driver.$(byTestId('iap-command-result'));
      const label = await result.getAttribute('content-desc');
      return label || (await result.getText());
    });
  }
  await driver.execute('mobile: deepLink', {
    url: `pocketpal://iap?cmd=${encodeURIComponent(command)}`,
    bundleId: IOS_BUNDLE_ID,
  });
  await driver.pause(400);
  return '';
}

/** Point the app at the mock and script the store for one scenario. */
export async function configureFakeStore(options: {
  products?: Record<string, string>;
  next?: string;
}): Promise<void> {
  await iapCommand(`api::${mockBase()}`);
  if (options.products) {
    const entries = Object.entries(options.products)
      .map(([id, price]) => `${id}=${price}`)
      .join('|');
    await iapCommand(`products::${entries}`);
  }
  if (options.next) {
    await iapCommand(`next::${options.next}`);
  }
}

/** Kill and relaunch, then restore the mock base the relaunch reads back. */
export async function relaunchApp(): Promise<void> {
  await driver.terminateApp(appId());
  await driver.pause(800);
  await driver.activateApp(appId());
  await iapCommand(`api::${mockBase()}`);
}

/** Uninstall and reinstall the app under test: a fresh install with no app data. */
export async function reinstallApp(): Promise<void> {
  const appPath = (browser.requestedCapabilities as any)['appium:app'];
  await (driver as any).removeApp(appId());
  await (driver as any).installApp(path.resolve(appPath));
  await (driver as any).activateApp(appId());
}
