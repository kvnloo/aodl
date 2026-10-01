import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('AODL');
});

function card(page, name) {
  return page.locator('.aodl-map__card').filter({
    has: page.locator('header b', { hasText: new RegExp(`^${name}$`) }),
  });
}

test('silhouettes use deterministic presentation geometry, not XYFlow', async ({ page }) => {
  await expect(page.locator('.aodl-map .react-flow')).toHaveCount(0);
  await expect(page.locator('.aodl-map .aodl-flow-node')).toHaveCount(0);

  const paired = card(page, 'Paired');
  await expect(paired.locator('.agent-topology-badge__nodes circle')).toHaveCount(2);

  const pipeline = card(page, 'Pipeline');
  await expect(pipeline.locator('.agent-topology-badge__nodes circle')).toHaveCount(5);

  const marketplace = card(page, 'Marketplace');
  await expect(marketplace.locator('.agent-topology-badge__nodes circle')).toHaveCount(6);
});

test('not-inferred swarm remains a glyph and cannot expose an invented editor', async ({ page }) => {
  const swarm = card(page, 'Swarm');
  await expect(swarm.locator('.aodl-map__status')).toHaveText('not-inferred');
  await expect(swarm.locator('.agent-topology-badge__nodes circle')).toHaveCount(8);
  await expect(swarm.locator('.aodl-silhouette-flow')).toHaveCount(0);
  await expect(swarm.locator('.aodl-flow-node')).toHaveCount(0);
  await expect(swarm.locator('select[name="kind"]')).toHaveCount(0);
});

test('capability cores stay metadata glyphs and do not expand into synthetic graphs', async ({ page }) => {
  const ladder = page.locator('.agent-core-language');
  await expect(ladder.locator('.agent-core-language__levels > .agent-core-level')).toHaveCount(3);
  await expect(ladder.locator('.agent-core-language__levels .agent-capability-core')).toHaveCount(3);
  await expect(ladder.locator('.aodl-topology-block')).toHaveCount(0);
  await expect(ladder.locator('.aodl-silhouette-flow')).toHaveCount(0);
  await expect(ladder.locator('.react-flow')).toHaveCount(0);
});

test('presentation glyphs do not overflow the phone or desktop column', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow, `overflow at ${width}px`).toBe(false);
  }
});
