import { test, expect } from '@playwright/test';

test('entra, abre Hoje, filtra um mês e abre uma compra', async ({ page }) => {
	await page.goto('/login/');
	await page.getByRole('button', { name: 'Entrar (só e2e)' }).click();
	await expect(page).toHaveURL(/hoje/);
	await expect(page.getByRole('heading', { name: /Novembro está/ })).toBeVisible();

	await page.getByRole('button', { name: 'Novembro 2026' }).click();
	await expect(page.getByRole('button', { name: 'Outubro 2026' })).toBeVisible();

	await page.getByRole('button', { name: /Entender/ }).click();
	await page.getByRole('button', { name: 'Compras e lançamentos' }).click();
	await expect(page).toHaveURL(/compras/);
	await page.getByText('Zaffari').first().click();
	await expect(page.getByText('Compra', { exact: true })).toBeVisible();
});
