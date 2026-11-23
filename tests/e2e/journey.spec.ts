import { test, expect } from '@playwright/test';

test('entra, abre Hoje, filtra um mês e abre uma compra', async ({ page }) => {
	await page.goto('/login/');
	await page.getByRole('button', { name: 'Entrar (só e2e)' }).click();
	await expect(page).toHaveURL(/hoje/);
	await expect(page.getByRole('heading', { name: 'Hoje' })).toBeVisible();

	await page.getByRole('button', { name: 'Nov 2026' }).click();
	await expect(page.getByText('Período 2026-11')).toBeVisible();

	await page.getByRole('link', { name: 'Conferir compras' }).click();
	await expect(page).toHaveURL(/compras/);
	await page.locator('button.row').first().click();
	await expect(page.getByLabel('Detalhe da compra')).toBeVisible();
});
