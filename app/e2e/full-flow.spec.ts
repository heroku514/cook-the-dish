import { test, expect } from "@playwright/test";

test.describe("CookTheDish full flow", () => {
  test("search → recipe → stores → shopping plan", async ({ page }) => {
    await page.goto("/");

    // Landing page
    await expect(page.locator("h1")).toContainText("CookTheDish");
    await expect(page.getByPlaceholder(/enter a dish/i)).toBeVisible();

    // Search a dish
    await page.getByPlaceholder(/enter a dish/i).fill("Mapo Tofu");
    await page.getByRole("button", { name: /cook this/i }).click();

    // Recipe page
    await expect(page.getByText("Mapo Tofu")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Sichuan Chinese")).toBeVisible();
    await expect(page.getByText("Ingredients")).toBeVisible();
    await expect(page.getByText("How to Cook")).toBeVisible();

    // Verify ingredients are listed
    await expect(page.getByText("firm tofu")).toBeVisible();
    await expect(page.getByText(/items to buy/)).toBeVisible();

    // Click "Find Where to Buy"
    await page.getByRole("button", { name: /find where to buy/i }).click();

    // Matching page — wait for product matches to load
    await expect(page.getByText("Products Found")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Kroger")).toBeVisible();
    await expect(page.getByText("H Mart")).toBeVisible();

    // Strategy picker should be visible with balanced pre-selected
    await expect(page.getByText("Choose Shopping Strategy")).toBeVisible();
    await expect(page.getByText("Balanced")).toBeVisible();

    // Generate plan
    await page.getByRole("button", { name: /generate shopping plan/i }).click();

    // Shopping plan page
    await expect(page.getByText("Shopping Plan")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/estimated total/i)).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /cook another dish/i })
    ).toBeVisible();
  });

  test("quick pick buttons trigger search", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Carbonara" }).click();

    // Should navigate to recipe view (demo mode returns Mapo Tofu for all searches)
    await expect(page.getByText("Ingredients")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("pantry toggle reduces items to buy count", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder(/enter a dish/i).fill("Mapo Tofu");
    await page.getByRole("button", { name: /cook this/i }).click();

    await expect(page.getByText("Ingredients")).toBeVisible({
      timeout: 10_000,
    });

    // Get initial "to buy" count
    const countBefore = await page.getByText(/items to buy/).textContent();
    const numBefore = parseInt(countBefore?.match(/(\d+)/)?.[1] || "0");

    // Click the first ingredient's checkbox (the pantry toggle button)
    const firstCheckbox = page.locator(
      'button[class*="rounded border-2"]'
    ).first();
    await firstCheckbox.click();

    // Count should decrease by 1
    const countAfter = await page.getByText(/items to buy/).textContent();
    const numAfter = parseInt(countAfter?.match(/(\d+)/)?.[1] || "0");
    expect(numAfter).toBe(numBefore - 1);
  });

  test("reset returns to search page", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder(/enter a dish/i).fill("Mapo Tofu");
    await page.getByRole("button", { name: /cook this/i }).click();

    await expect(page.getByText("Ingredients")).toBeVisible({
      timeout: 10_000,
    });

    // Click "Search another dish" back button
    await page.getByText("Search another dish").click();

    // Should be back on search page
    await expect(page.getByPlaceholder(/enter a dish/i)).toBeVisible();
  });
});
