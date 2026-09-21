import { expect, test } from '@playwright/test';

const SECTIONS = [
  'From intent to execution',
  'Formal object',
  'Three objects, never substituted',
  'Intent and participation',
  'Readings',
  'Translation',
  'Silhouettes',
  'Named hybrid — C(RAID)',
  'Adapters',
  'Visual decoder',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('AODL');
});

test('introduces the IR, not a cores dump', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('AODL');
  await expect(page.locator('h2')).toHaveText(SECTIONS);
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('.aodl-tex--display').first()).toContainText('O');
});

test('leads with the bounded Agent OS thesis and compiler boundary', async ({ page }) => {
  const hero = page.locator('.aodl-language__hero');
  await expect(hero).toContainText('semantic computation');
  await expect(hero).toContainText('operating-system bookkeeping');
  await expect(hero.getByRole('link', { name: 'Agent OS working note' })).toHaveAttribute('href', /issues\/22$/);

  const compiler = page.locator('section[aria-labelledby="aodl-compile-title"]');
  await expect(compiler).toContainText('AODL intent');
  await expect(compiler).toContainText('Hermes dry-run');
  await expect(compiler).toContainText('experimental');
  await expect(compiler.getByRole('link', { name: /Bend/i })).toHaveAttribute('href', /issues\/19$/);
});

test('object cards do not leak MathML into headings', async ({ page }) => {
  const headings = page.locator('.aodl-objects h3');
  await expect(headings).toHaveText(['Intent', 'Compiled plan', 'Observed']);
  for (const heading of await headings.all()) {
    const text = await heading.innerText();
    expect(text).not.toMatch(/i\s+n\s+t\s+e\s+n\s+t/);
    expect(text.split('\n').length).toBe(1);
    await expect(heading.locator('.katex-mathml')).toHaveCount(0);
    await expect(heading.locator('.aodl-tex')).toHaveCount(0);
  }
});

test('display math lines up with the copy column', async ({ page }) => {
  const copy = page.locator('.aodl-language__hero p').last();
  const display = page.locator('.aodl-tex--display').first();
  const copyBox = await copy.boundingBox();
  const mathBox = await display.boundingBox();
  expect(copyBox).toBeTruthy();
  expect(mathBox).toBeTruthy();
  expect(Math.abs(mathBox.x - copyBox.x)).toBeLessThan(24);
  const katex = display.locator('.katex').first();
  const katexBox = await katex.boundingBox();
  expect(Math.abs(katexBox.x - copyBox.x)).toBeLessThan(24);
});

test('translation spec link stays on one line', async ({ page }) => {
  const link = page.locator('#aodl-tau-title + p a').first();
  await expect(link).toHaveAttribute('href', /spec\/translation\.md$/);
  const box = await link.boundingBox();
  const fontSize = await link.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(box.height).toBeLessThan(fontSize * 1.8);
});

test('intent contract stays HOTL 0.2', async ({ page }) => {
  const section = page.locator('section[aria-labelledby="aodl-contract-title"]');
  await expect(section).toContainText('Preserve chosen challenge');
  await expect(section).toContainText('No fail event type');
  await expect(page.locator('h2', { hasText: 'Timebound' })).toHaveCount(0);
});

test('visual catalog stays bounded: cores and silhouettes are separate glyphs', async ({ page }) => {
  await expect(page.locator('.agent-encoding-reference')).toHaveCount(0);
  await expect(page.locator('.agent-topology-provider-picker')).toHaveCount(0);
  await expect(page.locator('details')).toHaveCount(0);
  await expect(page.locator('a[href*="design.html"]')).toHaveCount(0);
  await expect(page.locator('.agent-core-language')).toHaveCount(1);
  await expect(page.locator('.agent-core-language__levels .agent-capability-core')).toHaveCount(3);
  await expect(page.locator('.aodl-map .agent-topology-badge')).toHaveCount(16);
  await expect(page.locator('.aodl-map .agent-capability-core')).toHaveCount(0);
});

test('silhouettes never synthesize a semantic graph', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Timebound graph' })).toHaveCount(0);
  await expect(page.locator('.aodl-orchestration')).toHaveCount(0);
  await expect(page.locator('.aodl-map .aodl-map__card')).toHaveCount(16);
  await expect(page.locator('.aodl-map .aodl-silhouette-flow')).toHaveCount(0);
  await expect(page.locator('.aodl-map .react-flow')).toHaveCount(0);
  await expect(page.locator('.aodl-map .aodl-flow-node')).toHaveCount(0);
  await expect(page.locator('[data-mode="play"]')).toHaveCount(0);
  await expect(page.locator('[data-combo]')).toHaveCount(0);

  const swarm = page.locator('.aodl-map__card').filter({
    has: page.locator('header b', { hasText: /^Swarm$/ }),
  });
  await expect(swarm.locator('.aodl-map__status')).toHaveText('not-inferred');
  await expect(swarm.locator('.agent-topology-badge')).toHaveCount(1);
  await expect(swarm.locator('select')).toHaveCount(0);
});

test('no horizontal overflow at phone and desktop', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 2;
    });
    expect(overflow, `overflow at ${width}px`).toBe(false);
  }
});
