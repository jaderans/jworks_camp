import { expect, test } from '@playwright/test';
import { SHOTS, freshSetup, hasPlanner } from './helpers';

// Fix "today" so the restart countdown and calendars are stable: Sunday, Oct 4 2026, 10:00 PHT.
test.use({ timezoneId: 'Asia/Manila' });

test('owner sets up, imports the planner and works through every screen', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+08:00') });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Failed to load resource|trends\/latest\.json/.test(m.text())) errors.push(m.text());
  });

  await freshSetup(page, { importPlanner: true });

  // Calendar: November restarts with the Typography post on Wed, Nov 4 (Mon, Nov 2 is All Souls' Day).
  if (hasPlanner) {
    await expect(page.getByRole('heading', { name: 'Content calendar' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('grid', { name: /November 2026/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Typography 101/ }).first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/calendar-month.png`, fullPage: true });

    // Open a post, write a caption, check the platform tabs and the premium check.
    await page.getByRole('button', { name: /Typography 101/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Captions', exact: true }).click();
    await page.getByLabel('Caption', { exact: true }).fill('Font pairing is easier than you think.\n\nThree rules we use on every brand.');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(page.locator('.cap-preview')).toContainText('𝗙𝗼𝗻𝘁');
    await page.screenshot({ path: `${SHOTS}/post-captions.png` });
    await page.getByRole('dialog').getByRole('button', { name: /Premium check/ }).click();
    await page.getByRole('button', { name: 'All checked' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  }

  // Dashboard shows the countdown to the restart.
  await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
  await expect(page.getByText(/Posting restarts|Good morning/).first()).toBeVisible();
  if (hasPlanner) {
    await expect(page.getByText(/Posting restarts Tue, Nov 3/)).toBeVisible();
    await expect(page.getByText(/posts for the first two weeks back are ready/)).toBeVisible();
  }
  await page.screenshot({ path: `${SHOTS}/dashboard.png`, fullPage: true });

  await page.getByRole('link', { name: 'Board', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/board.png` });

  await page.getByRole('link', { name: 'Ideas', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Ideas' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/ideas.png`, fullPage: true });

  await page.getByRole('link', { name: 'Campaigns', exact: true }).first().click();
  await page.getByRole('button', { name: 'New campaign' }).click();
  await page.getByRole('button', { name: /Launch: JoshWorks now manages social media/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog').locator('input[aria-label="Title"]').first()).toHaveValue(/We now manage social media for local brands/);
  await page.screenshot({ path: `${SHOTS}/campaign-plan.png` });
  if (hasPlanner) {
    // The planner already fills every themed day, so the launch posts clash: move them to free days.
    await page.getByRole('button', { name: 'Move to free days' }).click();
    await expect(page.getByText(/Moved \d+ posts to free days/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Move to free days' })).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/campaign-plan-spread.png` });
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Create campaign/ }).click();
  await expect(page.getByText(/is on the calendar with/)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/campaigns.png`, fullPage: true });

  await page.getByRole('link', { name: 'Trends', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Trends' })).toBeVisible();
  await page.getByRole('link', { name: 'Playbook', exact: true }).click();
  await expect(page.getByText('What the algorithms reward now')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/trends-playbook.png`, fullPage: true });
  await page.getByRole('link', { name: 'Hooks', exact: true }).click();
  await page.getByLabel('Your version').fill('5 logo mistakes that make your café look cheap');
  await page.getByRole('button', { name: /Save today’s hook/ }).click();
  await expect(page.getByText('Done for today.')).toBeVisible();

  await page.getByRole('link', { name: 'Results', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/results.png`, fullPage: true });

  await page.getByRole('link', { name: 'Assistant', exact: true }).first().click();
  await expect(page.getByText('Connect Claude first')).toBeVisible();

  // SMM client: add, open, then a proposal and a contract.
  await page.getByRole('link', { name: 'Clients', exact: true }).first().click();
  await page.getByRole('button', { name: 'Add a client' }).first().click();
  await page.getByLabel('Business name').fill('Kape Ilonggo');
  await page.getByLabel('Industry').fill('Café');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /Kape Ilonggo/ })).toBeVisible();
  await page.getByLabel('Package').selectOption({ label: 'Starter · ₱4,500/month' });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.screenshot({ path: `${SHOTS}/client.png` });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: `${SHOTS}/clients.png` });

  await page.getByRole('link', { name: 'Packages', exact: true }).first().click();
  await expect(page.getByText('₱4,500').first()).toBeVisible();
  await expect(page.getByText(/Healthy · margin/).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/packages.png`, fullPage: true });
  await page.getByRole('link', { name: 'Proposals', exact: true }).click();
  await page.getByRole('button', { name: 'New proposal' }).click();
  await page.getByRole('dialog').getByLabel('Client', { exact: true }).selectOption({ label: 'Kape Ilonggo' });
  await page.getByRole('button', { name: /Growth · ₱7,500/ }).click();
  await page.getByText(/Founding client offer/).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF' }).click();
  const pdf = await download;
  expect(pdf.suggestedFilename()).toMatch(/P-2026-001.*\.pdf$/);
  await page.screenshot({ path: `${SHOTS}/proposal.png` });
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.getByRole('link', { name: 'Contracts', exact: true }).first().click();
  await page.getByRole('button', { name: 'New contract' }).first().click();
  await page.getByRole('dialog').getByLabel('Client', { exact: true }).selectOption({ label: 'Kape Ilonggo' });
  await page.getByRole('button', { name: 'Make it' }).click();
  await expect(page.getByText('Social Media Management Agreement').first()).toBeVisible();
  await expect(page.getByLabel('Preview')).toContainText('₱4,500 a month');
  await expect(page.getByLabel('Preview')).toContainText('Facebook and Instagram');
  await page.screenshot({ path: `${SHOTS}/contract.png` });
  const cdl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF' }).click();
  expect((await cdl).suggestedFilename()).toMatch(/C-2026-001.*\.pdf$/);
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.getByRole('link', { name: 'Team', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Team', exact: true })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/team.png` });
  await page.goto('/#/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/settings.png`, fullPage: true });

  // Dark mode.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.goto('/#/');
  await page.screenshot({ path: `${SHOTS}/dashboard-dark.png`, fullPage: true });
  if (hasPlanner) {
    await page.goto('/#/calendar?date=2026-11-10');
    await page.screenshot({ path: `${SHOTS}/calendar-dark.png`, fullPage: true });
  }

  expect(errors).toEqual([]);
});
