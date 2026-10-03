import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const outDir = '/opt/cursor/artifacts'
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

try {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForSelector('.hero-brand')
  await page.screenshot({ path: path.join(outDir, 'home_hero.png'), fullPage: false })

  await page.getByRole('link', { name: 'Create a character' }).click()
  await page.waitForURL('**/create')

  await page.getByPlaceholder('e.g. Mira Ashveil').fill('Mira Ashveil')
  await page.locator('label', { hasText: 'Race' }).locator('select').selectOption('Elf')
  await page.locator('label', { hasText: 'Class' }).locator('select').selectOption('Wizard')
  await page.locator('label', { hasText: 'Background' }).locator('select').selectOption('Sage')
  await page.locator('label', { hasText: 'Alignment' }).locator('select').selectOption('Chaotic Good')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Use standard array' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  for (const skill of ['Arcana', 'History', 'Investigation', 'Religion']) {
    await page.getByLabel(new RegExp(`^${skill}`)).check()
  }
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.locator('label', { hasText: 'Personality traits' }).locator('textarea').fill('Curious and restless')
  await page.getByRole('button', { name: 'Save character' }).click()

  await page.waitForURL('**/characters/**')
  await page.waitForSelector('h1', { hasText: 'Mira Ashveil' })
  await page.screenshot({ path: path.join(outDir, 'character_sheet.png'), fullPage: false })

  await page.getByRole('link', { name: 'Session Mode' }).click()
  await page.waitForURL('**/session')

  await page.getByLabel('Damage amount').fill('3')
  await page.getByRole('button', { name: 'Damage', exact: true }).click()

  await page.locator('select').filter({ hasText: 'Poisoned' }).selectOption('Poisoned')
  await page.getByRole('button', { name: 'Add' }).click()

  await page
    .getByPlaceholder(/Track clues/)
    .fill('Met the innkeeper; owed a favor')

  await page.waitForTimeout(400)
  const hpText = await page.locator('.hp-display').innerText()
  const poisonedVisible = await page.locator('.condition-chip', { hasText: 'Poisoned' }).isVisible()
  const notes = await page.getByPlaceholder(/Track clues/).inputValue()

  await page.screenshot({ path: path.join(outDir, 'session_mode_updated.png'), fullPage: false })

  console.log(JSON.stringify({ ok: true, hpText: hpText.replace(/\s+/g, ' ').trim(), poisonedVisible, notes }, null, 2))

  if (!poisonedVisible) throw new Error('Poisoned condition missing')
  if (!notes.includes('innkeeper')) throw new Error('Notes missing')
  if (!/\/\s*\d+/.test(hpText)) throw new Error(`Unexpected HP display: ${hpText}`)
} catch (err) {
  await page.screenshot({ path: path.join(outDir, 'e2e_failure.png'), fullPage: true })
  console.error(err)
  process.exitCode = 1
} finally {
  await browser.close()
}
