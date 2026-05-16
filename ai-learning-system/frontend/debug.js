const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });
  await page.goto('http://localhost:5173/admin/questions/edit');
  await page.waitForTimeout(2000);
  await browser.close();
})();
