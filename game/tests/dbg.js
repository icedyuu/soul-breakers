const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const out = await page.evaluate(new Function(require('fs').readFileSync(process.argv[2], 'utf8')));
  console.log(out); console.log('errors', errors.slice(0, 3));
  await browser.close();
})();
