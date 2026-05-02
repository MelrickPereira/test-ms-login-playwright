import { test, expect, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { totp } from 'otplib';
import * as OTPAuth from 'otpauth';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const clean = (value: string | undefined) => value?.replace(/^['"]|['"]$/g, '');
const MS_EMAIL = clean(process.env.MS_EMAIL);
const MS_PASSWORD = clean(process.env.MS_PASSWORD);
const MS_TOTP_SECRET = clean(process.env.MS_TOTP_SECRET);
const MS_EXPECTED_NAME = clean(process.env.MS_EXPECTED_NAME) || MS_EMAIL;

console.log('Using env path:', path.resolve(process.cwd(), '.env'));
console.log('Using email:', MS_EMAIL);
console.log('Using expected name:', MS_EXPECTED_NAME);
console.log('Using TOTP secret:', MS_TOTP_SECRET)
console.log('password is set:', MS_PASSWORD);

if (!MS_EMAIL || !MS_PASSWORD || !MS_TOTP_SECRET) {
  throw new Error('Missing MS_EMAIL, MS_PASSWORD, or MS_TOTP_SECRET in .env');
}

const clickPrimarySubmit = async (page: Page) => {
  const submitButton = page.locator('button[id="idSIButton9"], button[type="submit"], input[type="submit"]');
  await expect(submitButton.first()).toBeVisible({ timeout: 30000 });
  await submitButton.first().click();
};

test.describe('Microsoft login', () => {
  test('logs into Microsoft and verifies the signed-in user', async ({ page }) => {
    await page.goto('https://login.microsoftonline.com/');

    const emailInput = page.locator('input[name="loginfmt"], input[id="i0116"], input[type="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: 30000 });
    await emailInput.first().fill(MS_EMAIL);

    await clickPrimarySubmit(page);

    const passwordInput = page.locator('input[name="passwd"], input[id="i0118"], input[type="password"]');
    await expect(passwordInput.first()).toBeVisible({ timeout: 30000 });
    await passwordInput.first().fill(MS_PASSWORD);

    await clickPrimarySubmit(page);

    await page.getByRole('link', { name: 'I can\'t use my Microsoft' }).click();
    await page.getByRole('button', { name: 'Use a verification code' }).click();

    // const twoFaCode = totp.generate(MS_TOTP_SECRET);

    let totp = new OTPAuth.TOTP({
      issuer: 'Microsoft',
      label: MS_EMAIL,
      issuerInLabel: true,
      secret: MS_TOTP_SECRET,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    const twoFaCode = totp.generate();
    await page.getByRole('textbox', { name: 'Enter code' }).click();
    await page.getByRole('textbox', { name: 'Enter code' }).fill(twoFaCode);
    console.log('Generated 2FA code:', twoFaCode);
    
    
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
   

    // const staySignedInYes = page.locator('button', { hasText: /yes/i });
    // if (await staySignedInYes.count() > 0) {
    //   await staySignedInYes.first().click();
    // }

    // await page.waitForLoadState('networkidle');
    // await expect(page).not.toHaveURL(/login.microsoftonline.com/, { timeout: 60000 });

    const NameLocator = page.locator('text="Pereira, Melrick"');
    await expect(NameLocator.first()).toBeVisible({ timeout: 30000 });

    console.log('Login successful, user name or email is visible on the page.');

  });
});
