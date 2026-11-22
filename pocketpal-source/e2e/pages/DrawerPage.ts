/**
 * Drawer/Navigation Page Object
 * Handles interactions with the navigation drawer
 *
 * Uses shared Selectors utility for consistent cross-platform selectors
 */

import {BasePage, ChainableElement} from './BasePage';
import {Selectors, byPartialText} from '../helpers/selectors';

declare const browser: WebdriverIO.Browser;

export class DrawerPage extends BasePage {
  /**
   * Get models tab element (used to verify drawer is open)
   */
  get modelsTab(): ChainableElement {
    return this.getElement(Selectors.drawer.modelsTab);
  }

  /**
   * Get chat tab element
   */
  get chatTab(): ChainableElement {
    return this.getElement(Selectors.drawer.chatTab);
  }

  /**
   * Check whether the drawer root is mounted.
   */
  async isOpen(): Promise<boolean> {
    return this.isElementDisplayed(Selectors.drawer.container, 3000);
  }

  /**
   * Wait for the drawer root to be mounted.
   */
  async waitForOpen(timeout = 10000): Promise<void> {
    await this.waitForElement(Selectors.drawer.container, timeout);
  }

  /**
   * Wait for the drawer root to be removed.
   */
  async waitForClose(timeout = 5000): Promise<void> {
    await this.waitForElementToDisappear(Selectors.drawer.container, timeout);
  }

  /**
   * Navigate to Chat screen
   */
  async navigateToChat(): Promise<void> {
    await this.waitForOpen();
    await this.tap(Selectors.drawer.chatTab);
    // Wait a moment for drawer animation then verify it closed
    await browser.pause(300);
    await this.waitForClose();
  }

  /**
   * Navigate to Models screen
   */
  async navigateToModels(): Promise<void> {
    await this.waitForOpen();
    await this.tap(Selectors.drawer.modelsTab);
    // Wait a moment for drawer animation then verify it closed
    await browser.pause(300);
    await this.waitForClose();
  }

  /**
   * Tap a chat session in the sidebar by matching its title text
   */
  async tapSession(titleFragment: string): Promise<void> {
    await this.waitForOpen();
    await this.tap(byPartialText(titleFragment));
    await browser.pause(300);
    await this.waitForClose();
  }

  /**
   * Navigate to Settings screen
   */
  async navigateToSettings(): Promise<void> {
    await this.waitForOpen();
    await this.tap(Selectors.drawer.settingsTab);
    // Wait a moment for drawer animation then verify it closed
    await browser.pause(300);
    await this.waitForClose();
  }
}
