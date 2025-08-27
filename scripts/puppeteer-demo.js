// scripts/puppeteer-demo.js
// Puppeteer test: open local frontend, check for Hello World, and screenshot
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  // Wait for the heading to appear
  await page.waitForSelector('h1');
  const heading = await page.$eval('h1', el => el.textContent);
  if (heading.includes('Hello World')) {
    console.log('Test passed: Found Hello World heading');
  } else {
    console.error('Test failed: Hello World heading not found');
  }
  await page.screenshot({ path: 'frontend-home.png' });
  console.log('Screenshot saved as frontend-home.png');
  await browser.close();
})();
