const puppeteer = require('puppeteer');
const pkg = require('../../package');

const length = 256; // https://code.visualstudio.com/docs/extensionAPI/extension-manifest
const headless = process.argv[2] !== 'nonheadless';
void async function () {
  const window = await puppeteer.launch({ headless });
  const page = (await window.pages())[0];
  await page.setViewport({ height: length, width: length });
  await page.goto('file:///' + __dirname + '/index.html');
  await page.$eval('body', (body: any, pkg: any) => body.textContent = pkg.displayName + '👌', pkg);
  await page.screenshot({ omitBackground: true, path: '../../icon.png' });
  if (headless) {
    await window.close();
  } else {
    await page.$eval('body', (body: any) => body.classList.add('nonHeadless'));
    // The user will close the window
  }
}();
