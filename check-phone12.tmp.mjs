import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
await page.setContent(`
<form id="f" onsubmit="return false">
  <input id="a" type="text">
  <input id="phone" type="tel" autocomplete="tel">
</form>
<script src="file://${process.cwd()}/node_modules/inputmask/dist/inputmask.min.js"></script>
<script>
  Inputmask({ mask: '+9(999)999-99-99', showMaskOnHover: false }).mask(document.getElementById('phone'));
  document.getElementById('a').focus();
</script>
`, { waitUntil: 'load' })
await page.waitForTimeout(200)
await page.click('#a')
console.log('active after click a:', await page.evaluate(() => document.activeElement.id))
await page.click('#phone')
console.log('active after click phone:', await page.evaluate(() => document.activeElement.id))
await browser.close()
