import { test as base, expect, type Page } from "@playwright/test";
import { countryListAlpha2 } from "../src/lib/countries";
import { countries } from "../src/lib/game";

const progressKey = "flags-game:progress:v1";
const names: Record<string, string> = countryListAlpha2;
const countryCodes = countries.map(({ code }) => code.toUpperCase());
const testFlagSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#1489bd"/><rect y="100" width="300" height="100" fill="#ffd54f"/></svg>';
const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await use(page);
    expect(errors, "No uncaught browser errors").toEqual([]);
  },
});

test.beforeEach(async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  if (!testInfo.title.includes("@live")) {
    await page.route("https://flagcdn.com/**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: testFlagSVG,
      }),
    );
  }
});

async function forceCountry(page: Page, code: string) {
  await page.addInitScript(
    ({ codes, selected }) => {
      Math.random = () => (codes.indexOf(selected) + 0.25) / codes.length;
    },
    { codes: countryCodes, selected: code },
  );
}

async function openGame(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Type answer", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("img", { name: "Flag to identify" })).toBeVisible();
}

async function currentCountry(page: Page) {
  const src = await page.getByRole("img", { name: "Flag to identify" }).getAttribute("src");
  const code = src?.match(/\/([a-z]{2})\.svg$/)?.[1].toUpperCase();
  expect(code, "The flag URL contains a known country code").toBeTruthy();
  expect(names[code!]).toBeTruthy();
  return names[code!];
}

async function metric(page: Page, label: string, value: number) {
  await expect(page.locator(".game-metric").filter({ hasText: label }).locator("strong"))
    .toHaveText(String(value));
}

async function readyForNextAnswer(page: Page) {
  const typed = page.getByRole("textbox", { name: "Country name" });
  if (await typed.count()) {
    await expect(typed).not.toHaveAttribute("readonly");
  } else {
    await expect(page.locator(".answer-grid button").first()).toBeEnabled();
  }
}

test("typed answers track streak and total, survive reload, and remain separate from choices", async ({ page }) => {
  await forceCountry(page, "SY");
  await openGame(page);
  await page.getByRole("textbox", { name: "Country name" }).fill("  sYrIa  ");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".feedback-slot")).toContainText("Correct");
  await metric(page, "Current streak", 1);
  await metric(page, "Best streak", 1);
  await metric(page, "Total correct", 1);
  await readyForNextAnswer(page);
  await page.reload();
  await metric(page, "Current streak", 1);
  await metric(page, "Best streak", 1);
  await metric(page, "Total correct", 1);
  const wrongRoundCountry = await currentCountry(page);
  await page.getByRole("textbox", { name: "Country name" }).fill("not a country");
  await page.getByRole("textbox", { name: "Country name" }).press("Enter");
  await expect(page.locator(".feedback-slot")).toContainText(wrongRoundCountry);
  await metric(page, "Current streak", 0);
  await metric(page, "Best streak", 1);
  await metric(page, "Total correct", 1);
  await page.reload();
  await metric(page, "Best streak", 1);
  await metric(page, "Total correct", 1);
  await page.getByRole("button", { name: "Multiple choice", exact: true }).click();
  await metric(page, "Best streak", 0);
  await metric(page, "Total correct", 0);
  await page.getByRole("button", { name: "Type answer", exact: true }).click();
  await metric(page, "Best streak", 1);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), progressKey);
  expect(saved.typed).toEqual({ streak: 0, bestStreak: 1, correctAnswers: 1 });
  expect(saved.choice).toEqual({ streak: 0, bestStreak: 0, correctAnswers: 0 });
});

for (const [code, alias] of [
  ["GB", "UK"], ["US", "USA"], ["CI", "Ivory Coast"],
  ["CZ", "Czech Republic"], ["VN", "Vietnam"], ["IR", "Iran"],
  ["BO", "Bolivia"], ["RU", "Russia"],
]) {
  test(`accepts the familiar name ${alias}`, async ({ page }) => {
    await forceCountry(page, code);
    await openGame(page);
    await page.getByRole("textbox", { name: "Country name" }).fill(alias);
    await page.getByRole("textbox", { name: "Country name" }).press("Enter");
    await metric(page, "Current streak", 1);
    await metric(page, "Total correct", 1);
  });
}

test("choice rounds have four unique answers and shuffle the correct position; rapid key presses score once", async ({ page }) => {
  await page.addInitScript(() => {
    let seed = 12345;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  });
  await openGame(page);
  await page.getByRole("button", { name: "Multiple choice", exact: true }).click();
  const positions = new Set<number>();
  for (let round = 1; round <= 8; round++) {
    const options = page.locator(".answer-grid button");
    await expect(options).toHaveCount(4);
    const correct = await currentCountry(page);
    const labels = await options.locator(".country-name").allTextContents();
    const correctIndex = labels.findIndex((label) => label === correct);
    expect(correctIndex).toBeGreaterThanOrEqual(0);
    expect(new Set(labels).size).toBe(4);
    positions.add(correctIndex);
    await page.keyboard.press(String(correctIndex + 1));
    await page.keyboard.press(String(correctIndex + 1));
    await metric(page, "Current streak", round);
    await metric(page, "Total correct", round);
    await readyForNextAnswer(page);
    await expect(page.locator(".answer-grid [data-feedback]")).toHaveCount(0);
    await expect(page.locator(".feedback-slot")).toContainText(correct);
  }
  expect(positions.size, "The correct option moves between answer positions").toBeGreaterThan(1);
  await page.reload();
  await page.getByRole("button", { name: "Multiple choice", exact: true }).click();
  await metric(page, "Current streak", 8);
  await metric(page, "Best streak", 8);
  await metric(page, "Total correct", 8);
  const correct = await currentCountry(page);
  const wrong = page.locator(".answer-grid button").filter({ hasNot: page.getByText(correct, { exact: true }) }).first();
  await wrong.click();
  await metric(page, "Current streak", 0);
  await metric(page, "Best streak", 8);
  await metric(page, "Total correct", 8);
  await page.reload();
  await page.getByRole("button", { name: "Multiple choice", exact: true }).click();
  await metric(page, "Best streak", 8);
  await metric(page, "Total correct", 8);
});

test("empty typed answers do not consume a round, and legacy high scores migrate", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("HiScore", "19"));
  await forceCountry(page, "SY");
  await openGame(page);
  await metric(page, "Best streak", 19);
  await page.getByRole("textbox", { name: "Country name" }).fill("   ");
  await page.getByRole("textbox", { name: "Country name" }).press("Enter");
  await metric(page, "Current streak", 0);
  await metric(page, "Best streak", 19);
  await expect(page.locator(".feedback-slot")).not.toContainText("Incorrect");
  await page.getByRole("textbox", { name: "Country name" }).fill("Syria");
  await page.getByRole("textbox", { name: "Country name" }).press("Enter");
  await metric(page, "Current streak", 1);
  await metric(page, "Best streak", 19);
});

test("keyboard focus returns to answers after typed and choice submissions", async ({ page }) => {
  await forceCountry(page, "SY");
  await openGame(page);
  const input = page.getByRole("textbox", { name: "Country name" });
  await input.fill("Syria");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Type answer", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Multiple choice", exact: true })).toBeDisabled();
  await readyForNextAnswer(page);
  await expect(input).toBeFocused();
  await input.fill(await currentCountry(page));
  await input.press("Enter");
  await metric(page, "Current streak", 2);
  await readyForNextAnswer(page);
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "Multiple choice", exact: true }).click();
  await readyForNextAnswer(page);
  const correct = await currentCountry(page);
  const correctChoice = page.locator(".answer-grid button")
    .filter({ has: page.getByText(correct, { exact: true }) });
  await correctChoice.focus();
  await correctChoice.press("Enter");
  await metric(page, "Current streak", 1);
  await readyForNextAnswer(page);
  await expect(page.locator(".answer-grid button").first()).toBeFocused();
});

test("a failed flag cannot be answered and another flag recovers gameplay", async ({ page }) => {
  let failFirstFlag = true;
  await page.route("https://flagcdn.com/**", async (route) => {
    if (failFirstFlag) {
      failFirstFlag = false;
      await route.abort();
    } else {
      await route.fulfill({ contentType: "image/svg+xml", body: testFlagSVG });
    }
  });
  await forceCountry(page, "SY");
  await openGame(page);
  await expect(page.getByRole("alert")).toContainText("couldn’t load");
  await expect(page.getByRole("textbox", { name: "Country name" })).toHaveAttribute("readonly", "");
  await expect(page.getByRole("button", { name: "Check answer", exact: true })).toBeDisabled();
  await metric(page, "Current streak", 0);
  await page.getByRole("button", { name: "Try another flag", exact: true }).click();
  await readyForNextAnswer(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Country name" }).fill(await currentCountry(page));
  await page.getByRole("textbox", { name: "Country name" }).press("Enter");
  await metric(page, "Current streak", 1);
});

for (const unavailable of ["malformed", "blocked"]) {
  test(`the game remains playable with ${unavailable} local storage`, async ({ page }) => {
    if (unavailable === "malformed") {
      await page.addInitScript((key) => localStorage.setItem(key, "{invalid json"), progressKey);
    } else {
      await page.addInitScript(() => {
        Storage.prototype.getItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
        Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
      });
    }
    await forceCountry(page, "SY");
    await openGame(page);
    await page.getByRole("textbox", { name: "Country name" }).fill("Syria");
    await page.getByRole("textbox", { name: "Country name" }).press("Enter");
    await metric(page, "Current streak", 1);
    await page.getByRole("button", { name: "Multiple choice", exact: true }).click();
    await expect(page.locator(".answer-grid button")).toHaveCount(4);
  });
}

test("dark mode uses #161616 and persists across reloads", async ({ page }) => {
  await openGame(page);
  await page.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(22, 22, 22)");
  await page.reload();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(22, 22, 22)");
  await page.getByRole("button", { name: "Switch to light mode", exact: true }).click();
  await expect(page.locator("body")).not.toHaveCSS("background-color", "rgb(22, 22, 22)");
});

for (const [width, height] of [
  [320, 568], [375, 667], [390, 844], [768, 1024], [1024, 768],
  [1440, 900], [1920, 1080], [667, 375], [640, 450],
]) {
  test(`centered and usable at ${width}×${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await forceCountry(page, "GS");
    await openGame(page);
    for (const mode of ["Type answer", "Multiple choice"]) {
      if (mode === "Multiple choice") {
        const available = countryCodes.filter((code) => code !== "GS");
        await page.evaluate((random) => { Math.random = () => random; },
          (available.indexOf("SH") + 0.25) / available.length);
      }
      await page.getByRole("button", { name: mode, exact: true }).click();
      await expect(page.locator(".game-shell")).toBeVisible();
      const geometry = await page.evaluate(() => {
        const shell = document.querySelector(".game-shell")!.getBoundingClientRect();
        const flag = document.querySelector('img[alt="Flag to identify"]')!.getBoundingClientRect();
        const frame = document.querySelector(".flag-frame")!.getBoundingClientRect();
        const answers = document.querySelector(".answer-grid, .answer-form")!.getBoundingClientRect();
        const controls = [...document.querySelectorAll("button, input, a, summary")]
          .filter((element) => element.getBoundingClientRect().width > 0)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { text: element.textContent, width: rect.width, height: rect.height };
          });
        return {
          pageWidth: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          centers: [shell, flag, answers].map((rect) => rect.left + rect.width / 2),
          flag: { top: flag.top, bottom: flag.bottom, left: flag.left, right: flag.right },
          frame: { top: frame.top, bottom: frame.bottom, left: frame.left, right: frame.right },
          answerTop: answers.top,
          scoreTops: [...document.querySelectorAll(".game-metric strong")]
            .map((element) => element.getBoundingClientRect().top),
          controls,
          optionRows: [...document.querySelectorAll(".answer-grid button")]
            .map((element) => element.getBoundingClientRect().top),
        };
      });
      expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewport);
      expect(Math.max(...geometry.scoreTops) - Math.min(...geometry.scoreTops)).toBeLessThanOrEqual(1);
      for (const center of geometry.centers) expect(Math.abs(center - width / 2)).toBeLessThanOrEqual(2);
      expect(geometry.flag.top).toBeGreaterThanOrEqual(geometry.frame.top - 1);
      expect(geometry.flag.bottom).toBeLessThanOrEqual(geometry.frame.bottom + 1);
      expect(geometry.flag.left).toBeGreaterThanOrEqual(geometry.frame.left - 1);
      expect(geometry.flag.right).toBeLessThanOrEqual(geometry.frame.right + 1);
      expect(geometry.answerTop - geometry.flag.bottom).toBeGreaterThanOrEqual(8);
      for (const control of geometry.controls) {
        expect(control.width, `${control.text} touch width`).toBeGreaterThanOrEqual(44);
        expect(control.height, `${control.text} touch height`).toBeGreaterThanOrEqual(44);
      }
      if (mode === "Multiple choice") {
        expect(geometry.optionRows).toHaveLength(4);
        expect(new Set(geometry.optionRows).size).toBe(width >= 1024 ? 1 : width >= 480 ? 2 : 4);
        const longAnswer = page.locator(".answer-grid .country-name").filter({ hasText: names.SH });
        await expect(longAnswer).toBeVisible();
        expect(await longAnswer.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      }
    }
    await page.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(22, 22, 22)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath("responsive.png"), fullPage: true });
  });
}

test("@live flag assets load and a real choice round is playable", async ({ page }) => {
  test.skip(!process.env.FLAGS_GAME_LIVE_ASSETS, "Set FLAGS_GAME_LIVE_ASSETS=1 to check the external flag service");
  await forceCountry(page, "SY");
  await openGame(page);
  await expect.poll(() => page.getByRole("img", { name: "Flag to identify" })
    .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  await page.getByRole("button", { name: "Multiple choice", exact: true }).click();
  await expect.poll(() => page.getByRole("img", { name: "Flag to identify" })
    .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  const correct = await currentCountry(page);
  await page.locator(".answer-grid button").filter({ has: page.getByText(correct, { exact: true }) }).click();
  await metric(page, "Total correct", 1);
});
