import { chromium } from 'playwright'

const browser = await chromium.launch({
  headless: false,
  args: ['--window-size=1280,840', '--window-position=40,40'],
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()

const pause = (ms) => page.waitForTimeout(ms)

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await pause(1200)

await page.getByRole('link', { name: 'Create a character' }).click()
await pause(800)

await page.getByPlaceholder('e.g. Mira Ashveil').click()
await page.keyboard.type('Mira Ashveil', { delay: 45 })
await page.locator('label', { hasText: 'Race' }).locator('select').selectOption('Elf')
await page.locator('label', { hasText: 'Class' }).locator('select').selectOption('Wizard')
await page.locator('label', { hasText: 'Background' }).locator('select').selectOption('Sage')
await page.locator('label', { hasText: 'Alignment' }).locator('select').selectOption('Chaotic Good')
await pause(600)
await page.getByRole('button', { name: 'Continue' }).click()
await pause(700)

await page.getByRole('button', { name: 'Use standard array' }).click()
await pause(500)
await page.getByRole('button', { name: 'Continue' }).click()
await pause(600)

for (const skill of ['Arcana', 'History', 'Investigation', 'Religion']) {
  await page.getByLabel(new RegExp(`^${skill}`)).check()
  await pause(150)
}
await page.getByRole('button', { name: 'Continue' }).click()
await pause(600)

await page
  .locator('label', { hasText: 'Personality traits' })
  .locator('textarea')
  .fill('Curious and restless')
await pause(400)
await page.getByRole('button', { name: 'Save character' }).click()
await page.waitForURL('**/characters/**')
await pause(1400)

await page.getByRole('link', { name: 'Session Mode' }).click()
await page.waitForURL('**/session')
await pause(900)

await page.getByLabel('Damage amount').fill('3')
await page.getByRole('button', { name: 'Damage', exact: true }).click()
await pause(700)

await page.locator('.panel').filter({ hasText: 'Conditions' }).locator('select').selectOption('Poisoned')
await page.locator('.panel').filter({ hasText: 'Conditions' }).getByRole('button', { name: 'Add' }).click()
await pause(500)

await page.getByPlaceholder(/Track clues/).click()
await page.keyboard.type('Met the innkeeper; owed a favor', { delay: 25 })
await pause(1800)

await browser.close()
console.log('demo complete')
