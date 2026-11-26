import { test, expect } from '@playwright/test';

test('entra, abre Hoje, alterna período e navega para compras e novas views', async ({ page }) => {
	await page.goto('/login/');
	await page.getByRole('button', { name: 'Entrar (só e2e)' }).click();
	await expect(page).toHaveURL(/hoje/);
	await expect(page.getByRole('heading').first()).toBeVisible();

	// Alterna período sem depender de mês fixo
	const perBtn = page.locator('header button').filter({ hasText: /\d{4}/ }).first();
	const initialPeriod = (await perBtn.textContent())?.trim() ?? '';
	expect(initialPeriod.length).toBeGreaterThan(0);
	await perBtn.click();
	await expect(perBtn).not.toHaveText(initialPeriod);

	// Navega para Compras e abre detalhe
	await page.getByRole('button', { name: /Entender/ }).click();
	await page.getByRole('button', { name: 'Compras e lançamentos' }).click();
	await expect(page).toHaveURL(/compras/);
	await page.getByText('Zaffari').first().click();
	await expect(page.getByText('Compra', { exact: true })).toBeVisible();
});
