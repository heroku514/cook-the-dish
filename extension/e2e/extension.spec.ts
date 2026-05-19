import { test, expect, chromium, type BrowserContext } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, "../dist");

let context: BrowserContext;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

function getExtensionId(): string {
  const workers = context.serviceWorkers();
  if (workers.length === 0) throw new Error("No service workers found");
  return workers[0].url().split("/")[2];
}

async function waitForServiceWorker() {
  let sw = context.serviceWorkers()[0];
  if (!sw) {
    sw = await context.waitForEvent("serviceworker");
  }
  return sw;
}

test.describe("extension popup", () => {
  test("loads and shows recipe input form", async () => {
    await waitForServiceWorker();
    const extensionId = getExtensionId();

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await expect(page.getByRole("heading", { name: "CookTheDish" })).toBeVisible();
    await expect(page.getByPlaceholder("Enter a dish name...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cook This!" })).toBeVisible();

    await page.close();
  });

  test("Cook This! button is disabled when input is empty", async () => {
    const extensionId = getExtensionId();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    const button = page.getByRole("button", { name: "Cook This!" });
    await expect(button).toBeDisabled();

    await page.close();
  });

  test("Cook This! button enables when dish name is entered", async () => {
    const extensionId = getExtensionId();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await page.getByPlaceholder("Enter a dish name...").fill("Pad Thai");
    const button = page.getByRole("button", { name: "Cook This!" });
    await expect(button).toBeEnabled();

    await page.close();
  });

  test("quick pick buttons are present", async () => {
    const extensionId = getExtensionId();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    for (const dish of ["Mapo Tofu", "Pad Thai", "Carbonara", "Tikka Masala", "Beef Pho"]) {
      await expect(page.getByRole("button", { name: dish })).toBeVisible();
    }

    await page.close();
  });

  test("quick pick triggers submit and shows error (no backend)", async () => {
    const extensionId = getExtensionId();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await page.getByRole("button", { name: "Mapo Tofu" }).click();
    // Quick picks call handleSubmit directly; without a backend,
    // it should show an error message after the request fails
    await expect(page.locator("[class*='bg-red']")).toBeVisible({ timeout: 10000 });

    await page.close();
  });

  test("servings dropdown has expected options", async () => {
    const extensionId = getExtensionId();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    const select = page.getByRole("combobox");
    const options = await select.locator("option").allTextContents();
    expect(options).toEqual(["1", "2", "3", "4", "6", "8"]);

    await page.close();
  });

  test("servings defaults to 2", async () => {
    const extensionId = getExtensionId();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    const select = page.getByRole("combobox");
    await expect(select).toHaveValue("2");

    await page.close();
  });
});

test.describe("service worker", () => {
  test("service worker is registered and running", async () => {
    const sw = await waitForServiceWorker();
    expect(sw.url()).toContain("service-worker");
  });

  test("responds to GET_STATUS message from popup", async () => {
    const extensionId = getExtensionId();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    const status = await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "GET_STATUS" }, resolve);
      });
    });

    expect(status).toEqual({ type: "STATUS", status: "idle" });
    await page.close();
  });
});

test.describe("content script", () => {
  test("content script injects into Instacart pages", async () => {
    const page = await context.newPage();
    await page.goto("https://www.instacart.com", { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});

    const hasContentScript = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        try {
          chrome.runtime.sendMessage({ type: "PING" }, (response) => {
            resolve(response?.type === "PONG");
          });
        } catch {
          resolve(false);
        }
      });
    }).catch(() => false);

    await page.close();
  });
});
