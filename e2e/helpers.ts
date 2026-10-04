import { existsSync, mkdirSync } from 'node:fs';
import type { Page } from '@playwright/test';

export const SHOTS = process.env.SHOTS || 'test-results/shots';
if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

export const PLANNER = 'Jworks Previous Campaigns/JoshWorks_Content_Planner_Jun15-Nov_2026 (1).xlsx';
export const hasPlanner = existsSync(PLANNER);

/** Fresh app: clear storage, then run first-time setup as the owner. */
export async function freshSetup(page: Page, opts: { importPlanner?: boolean } = {}) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases();
    await Promise.all(dbs.map((d) => new Promise((r) => { const q = indexedDB.deleteDatabase(d.name as string); q.onsuccess = q.onerror = q.onblocked = () => r(null); })));
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Set it up/ }).click();
  await page.getByLabel('Your name').fill('Joshua');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('heading', { name: 'Bring in your content planner' }).waitFor();
  if (opts.importPlanner && hasPlanner) {
    await page.locator('input[type=file]').setInputFiles(PLANNER);
    await page.getByRole('button', { name: 'Preview' }).click();
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.waitForURL(/#\/calendar/);
  } else {
    await page.getByRole('button', { name: 'Skip for now' }).click();
  }
}

/** Fail if the page scrolls sideways (things wider than the screen). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
