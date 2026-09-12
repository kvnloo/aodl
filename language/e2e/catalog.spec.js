import { expect, test } from '@playwright/test';

const SECTIONS = [
  'Formal object',
  'Three objects, never substituted',
  'Readings',
  'Translation',
  'Silhouettes',
  'Named hybrid — C(RAID)',
  'Timebound graph',
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

test('no duplicate encoding expand or HomeForge design.html', async ({ page }) => {
  await expect(page.locator('.agent-encoding-reference')).toHaveCount(0);
  await expect(page.locator('.agent-topology-provider-picker')).toHaveCount(0);
  await expect(page.locator('details')).toHaveCount(0);
  await expect(page.locator('a[href*="design.html"]')).toHaveCount(0);
  await expect(page.locator('.agent-core-language')).toHaveCount(1);
  await expect(page.locator('.agent-core-language .agent-capability-core')).toHaveCount(3);
});

test('timebound graph expands cores into typed xyflow nodes', async ({ page }) => {
  const orch = page.locator('.aodl-orchestration');
  await expect(orch.getByRole('heading', { name: 'Timebound graph' })).toBeVisible();
  await expect(page.locator('[data-mode="play"]')).toHaveCount(0);
  await expect(page.locator('[data-combo]')).toHaveCount(0);
  await orch.getByRole('button', { name: 'expand C(RAID)' }).click();
  const graph = orch.locator('.aodl-program-shell[data-program="craid"]');
  await expect(graph.locator('.aodl-flow-node')).toHaveCount(10);
  await expect(graph.locator('.agent-capability-core')).toHaveCount(10);
  await expect(graph.locator('[data-relation="observation"]')).toHaveCount(1);
  await graph.getByRole('button', { name: 'expand scoutA' }).click();
  const sheet = graph.locator('.aodl-flow-node[data-expanded="true"]');
  await expect(sheet).toHaveCount(1);
  await sheet.locator('select[name="kind"]').selectOption('tool');
  await expect(graph.locator('.aodl-flow-node[data-kind="tool"]')).toHaveCount(1);
  await graph.getByRole('button', { name: 'Collapse to core' }).click();
  await expect(orch.locator('.aodl-program-shell')).toHaveCount(0);
});

test('o8 list mission is two packets, not one invented DAG', async ({ page }) => {
  const orch = page.locator('.aodl-orchestration');
  await orch.getByRole('button', { name: 'expand o8 list' }).click();
  const graph = orch.locator('.aodl-program-shell[data-program="o8list"]');
  await expect(graph.locator('.aodl-flow-node')).toHaveCount(6);
  await expect(graph.locator('[data-relation="allocation"]')).toHaveCount(2);
  await expect(graph.locator('[data-relation="dependency"]')).toHaveCount(0);
  await expect(graph.locator('.aodl-flow')).toHaveAttribute('data-events', '3');
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
