import { expect, test } from '@playwright/test';

// First run needs browsers: pnpm exec playwright install
test('home page renders the starter heading', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /edit the page\.tsx file/i }),
  ).toBeVisible();
});
