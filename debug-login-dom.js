const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://login.microsoftonline.com/');
  await page.waitForLoadState('networkidle');
  console.log(await page.textContent('body'));
  await browser.close();
})();
