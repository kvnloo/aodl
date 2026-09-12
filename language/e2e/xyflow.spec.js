import { expect, test } from '@playwright/test';

const HUES = {
  openai: '#54d7c2',
  anthropic: '#e6b86f',
  xai: '#d875ef',
  moonshot: '#7f91ff',
  cursor: '#5ea9ff',
  fable: '#ef7d63',
  multi: '#d9bd7a',
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('AODL');
});

function card(page, name) {
  return page.locator('.aodl-map__card').filter({
    has: page.locator('header b', { hasText: new RegExp(`^${name}$`) }),
  });
}

function parseMs(duration) {
  return Math.max(
    0,
    ...duration.split(',').map((part) => {
      const raw = part.trim();
      const n = parseFloat(raw);
      if (Number.isNaN(n)) return 0;
      return raw.includes('ms') ? n : n * 1000;
    }),
  );
}

async function explode(page, name) {
  const unit = card(page, name);
  await unit.scrollIntoViewIfNeeded();
  await expect(unit).toHaveAttribute('data-zoom', 'core');
  await unit.locator('.aodl-topology-block__core').click();
  await expect(unit).toHaveAttribute('data-zoom', 'pattern');
  await expect(unit.locator('.aodl-silhouette-flow')).toHaveCount(1);
  return unit;
}

test('silhouette cards rest as large topology cores, not tiny graphs', async ({ page }) => {
  await expect(page.locator('.aodl-orchestration')).toHaveCount(0);
  await expect(page.locator('.aodl-map .aodl-map__card')).toHaveCount(16);
  await expect(page.locator('.aodl-map .aodl-silhouette-flow')).toHaveCount(0);
  await expect(page.locator('.aodl-map .aodl-topology-block__core .agent-capability-core')).toHaveCount(16);
  await expect(page.locator('[data-mode="play"]')).toHaveCount(0);

  const market = card(page, 'Marketplace');
  await expect(market).toHaveAttribute('data-zoom', 'core');
  await expect(market.locator('.agent-capability-core')).toHaveAttribute('data-topology', 'marketplace');
  const box = await market.locator('.agent-capability-core').boundingBox();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThan(80);
  expect(box.height).toBeGreaterThan(80);
  await expect(market.locator('.aodl-flow-node')).toHaveCount(0);
  await expect(market.locator('select[name="kind"]')).toHaveCount(0);
});

test('clicking a marketplace orb breaks into the silhouette, then a node edits', async ({ page }) => {
  const market = await explode(page, 'Marketplace');
  await expect(market.locator('.aodl-silhouette-flow')).toHaveAttribute('data-topology', 'marketplace');
  await expect(market.locator('.aodl-flow-node')).toHaveCount(7);
  const dot = market.locator('.aodl-flow-node').first();
  const box = await dot.boundingBox();
  expect(box.width).toBeLessThan(28);
  await expect(dot).toHaveAttribute('data-expanded', 'false');
  await expect(market.locator('select[name="kind"]')).toHaveCount(7);
  const sheetOpacity = await dot.locator('.aodl-flow-sheet').evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(sheetOpacity)).toBeLessThan(0.05);

  await dot.click();
  await expect(dot).toHaveAttribute('data-expanded', 'true');
  await expect(dot.locator('select[name="kind"]')).toBeVisible();
});

test('pipeline hues match the visual language after the orb explodes', async ({ page }) => {
  const pipe = await explode(page, 'Pipeline');
  await expect(pipe.locator('.aodl-flow-node')).toHaveCount(5);
  const hues = await pipe.locator('.aodl-flow-node').evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).getPropertyValue('--topology-node').trim()),
  );
  expect(hues).toEqual([HUES.openai, HUES.anthropic, HUES.moonshot, HUES.xai, HUES.cursor]);
  const rfBg = await pipe.locator('.react-flow__node').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(rfBg === 'rgba(0, 0, 0, 0)' || rfBg === 'transparent').toBeTruthy();
  const pad = await pipe.locator('.react-flow__node').first().evaluate((el) => getComputedStyle(el).padding);
  expect(pad).toBe('0px');
  const shadow = await pipe.locator('.react-flow__node').first().evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow === 'none' || shadow === '').toBeTruthy();
});

test('clicking a silhouette node grows it into the editor with a long ease', async ({ page }) => {
  const pipe = await explode(page, 'Pipeline');
  const node = pipe.locator('.aodl-flow-node').first();
  const motion = await node.evaluate((el) => {
    const self = getComputedStyle(el);
    const clip = el.querySelector('.aodl-flow-sheet-clip');
    const glyph = el.querySelector('.aodl-flow-glyph');
    const clipStyle = clip ? getComputedStyle(clip) : self;
    const glyphStyle = glyph ? getComputedStyle(glyph) : self;
    return {
      nodeMs: self.transitionDuration,
      nodeProp: self.transitionProperty,
      clipMs: clipStyle.transitionDuration,
      clipProp: clipStyle.transitionProperty,
      glyphMs: glyphStyle.transitionDuration,
      glyphProp: glyphStyle.transitionProperty,
    };
  });
  const longest = Math.max(parseMs(motion.nodeMs), parseMs(motion.clipMs), parseMs(motion.glyphMs));
  expect(longest).toBeGreaterThanOrEqual(400);
  const props = `${motion.nodeProp} ${motion.clipProp} ${motion.glyphProp}`;
  expect(props).toMatch(/transform|opacity|width|height|max-height|grid-template-rows/);

  await node.click();
  await expect(node).toHaveAttribute('data-expanded', 'true');
  await expect(node.locator('select[name="kind"]')).toBeVisible();
  await expect.poll(async () => {
    return node.locator('.agent-capability-core').evaluate((el) => el.getBoundingClientRect().width);
  }).toBeGreaterThan(40);
  const coreBox = await node.locator('.agent-capability-core').boundingBox();
  expect(coreBox.width).toBeGreaterThan(40);
  const sheetBox = await node.locator('.aodl-flow-sheet').boundingBox();
  expect(sheetBox.width).toBeGreaterThan(80);
  expect(sheetBox.height).toBeGreaterThan(80);
  await expect.poll(async () => {
    return node.locator('.aodl-flow-sheet').evaluate((el) => Number(getComputedStyle(el).opacity));
  }).toBeGreaterThan(0.9);
});

test('silhouette grow stays on the clicked dot at phone and desktop', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const pipe = await explode(page, 'Pipeline');
    const node = pipe.locator('.aodl-flow-node').first();
    await expect.poll(async () => {
      const box = await node.boundingBox();
      return box ? box.width : 0;
    }).toBeGreaterThan(0);
    const before = await node.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width };
    });
    expect(before.w).toBeLessThan(28);
    await node.click();
    await expect(node).toHaveAttribute('data-expanded', 'true');
    await expect.poll(async () => {
      return node.locator('.agent-capability-core').evaluate((el) => el.getBoundingClientRect().height);
    }).toBeGreaterThan(40);
    const after = await node.evaluate((el) => {
      const core = el.querySelector('.agent-capability-core');
      const sheet = el.querySelector('.aodl-flow-sheet');
      const c = core.getBoundingClientRect();
      const s = sheet.getBoundingClientRect();
      return {
        cx: c.x + c.width / 2,
        cy: c.y + c.height / 2,
        coreH: c.height,
        sheetY: s.y,
        sheetW: s.width,
      };
    });
    expect(Math.abs(after.cx - before.cx), `core x jump at ${width}px`).toBeLessThan(16);
    expect(Math.abs(after.cy - before.cy), `core y jump at ${width}px`).toBeLessThan(16);
    expect(after.coreH).toBeGreaterThan(40);
    expect(after.sheetY).toBeGreaterThan(after.cy);
    expect(after.sheetW).toBeGreaterThan(80);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow, `overflow at ${width}px`).toBe(false);
  }
});

test('expanded silhouette edits language fields and kind retints the core', async ({ page }) => {
  const pipe = await explode(page, 'Pipeline');
  await pipe.locator('.aodl-flow-node').first().click();
  const sheet = pipe.locator('.aodl-flow-node[data-expanded="true"]');
  await expect(sheet.locator('select[name="kind"]')).toBeVisible();
  await sheet.locator('select[name="lifecycle"]').selectOption('running');
  await sheet.locator('input[name="capabilities"]').fill('execute, review');
  await sheet.locator('input[name="inSchema"]').fill('Packet');
  await expect(sheet.locator('select[name="lifecycle"]')).toHaveValue('running');
  await expect(sheet.locator('input[name="capabilities"]')).toHaveValue('execute, review');
  await expect(sheet.locator('input[name="inSchema"]')).toHaveValue('Packet');
  await sheet.locator('select[name="kind"]').selectOption('tool');
  await expect(sheet).toHaveAttribute('data-kind', 'tool');
  await expect(sheet.locator('select[name="harness"]')).toHaveCount(0);
  const hue = await sheet.locator('.agent-capability-core').evaluate((el) =>
    getComputedStyle(el).getPropertyValue('--core-provider').trim(),
  );
  expect(hue).toBe(HUES.xai);
});

test('shift-click expands a selected set of silhouette nodes together', async ({ page }) => {
  const pipe = await explode(page, 'Pipeline');
  const nodes = pipe.locator('.aodl-flow-node');
  await nodes.nth(0).click();
  await expect(pipe.locator('.aodl-flow-node[data-expanded="true"]')).toHaveCount(1);
  await nodes.nth(1).click({ modifiers: ['Shift'] });
  await expect(nodes.nth(0)).toHaveAttribute('data-expanded', 'true');
  await expect(nodes.nth(1)).toHaveAttribute('data-expanded', 'true');
  await expect(pipe.locator('.aodl-flow-node[data-expanded="true"]')).toHaveCount(2);
});

test('decoder orb explodes into its topology silhouette, not a sheet on the orb', async ({ page }) => {
  const ladder = page.locator('.agent-core-language');
  await expect(ladder.locator('.agent-core-language__levels > .agent-core-level')).toHaveCount(3);
  await expect(ladder.locator('.agent-core-language__levels .agent-capability-core')).toHaveCount(3);
  const council = ladder.locator('.agent-core-level').nth(2);
  await expect(council.locator('button button')).toHaveCount(0);
  await expect(council.locator('.agent-capability-core')).toHaveAttribute('data-topology', 'swarm');
  const before = await council.locator('.agent-capability-core').boundingBox();
  expect(before.width).toBeGreaterThan(80);
  await council.locator('.aodl-topology-block__core').click();
  await expect(council).toHaveAttribute('data-zoom', 'pattern');
  const flow = council.locator('.aodl-silhouette-flow');
  await expect(flow).toHaveCount(1);
  await expect(flow).toHaveAttribute('data-topology', 'swarm');
  await expect(flow.locator('.aodl-flow-node')).toHaveCount(8);
  await expect(council.locator('.aodl-topology-block__core select[name="kind"]')).toHaveCount(0);
  await expect(council.locator('button button')).toHaveCount(0);

  const node = flow.locator('.aodl-flow-node').first();
  await node.click();
  await expect(node).toHaveAttribute('data-expanded', 'true');
  await expect(node.locator('select[name="kind"]')).toBeVisible();
  await expect(ladder.locator('.agent-core-language__levels > .agent-core-level')).toHaveCount(3);
});

test('grow eases; reduced motion snaps', async ({ page }) => {
  const pipe = await explode(page, 'Pipeline');
  const ease = await pipe.locator('.aodl-flow-node').first().evaluate((el) => {
    const clip = el.querySelector('.aodl-flow-sheet-clip') || el;
    return getComputedStyle(clip).transitionTimingFunction;
  });
  expect(ease).toMatch(/cubic-bezier|ease/);
  expect(ease).not.toBe('linear');
  expect(ease).not.toBe('ease');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const reducedPipe = await explode(page, 'Pipeline');
  const reduced = await reducedPipe.locator('.aodl-flow-node').first().evaluate((el) => {
    const clip = el.querySelector('.aodl-flow-sheet-clip') || el;
    const glyph = el.querySelector('.aodl-flow-glyph') || el;
    return Math.max(
      ...[el, clip, glyph].map((node) => {
        const d = getComputedStyle(node).transitionDuration;
        return Math.max(0, ...d.split(',').map((part) => {
          const raw = part.trim();
          const n = parseFloat(raw);
          if (Number.isNaN(n)) return 0;
          return raw.includes('ms') ? n : n * 1000;
        }));
      }),
    );
  });
  expect(reduced).toBeLessThan(50);
});

test('orb explode and node edit do not overflow the phone column', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const market = await explode(page, 'Marketplace');
  const overflowCore = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflowCore).toBe(false);
  await market.locator('.aodl-flow-node').first().click();
  await expect(market.locator('.aodl-flow-node[data-expanded="true"]')).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow).toBe(false);
});
