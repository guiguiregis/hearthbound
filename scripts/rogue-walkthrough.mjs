import { chromium } from 'playwright'
import fs from 'node:fs'

const out = '/opt/cursor/artifacts'
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const shot = async (name) => {
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false })
}

await page.goto('http://localhost:5173/create', { waitUntil: 'networkidle' })

// Step 1 Identity
await page.getByPlaceholder('e.g. Mira Ashveil').fill('Nyx Quickshadow')
await page.locator('label', { hasText: 'Race' }).locator('select').selectOption('Halfling')
await page.locator('label', { hasText: 'Class' }).locator('select').selectOption('Rogue')
await page.locator('label', { hasText: 'Background' }).locator('select').selectOption('Criminal')
await page.locator('label', { hasText: 'Alignment' }).locator('select').selectOption('Chaotic Neutral')
await shot('rogue_step1_identity')

await page.getByRole('button', { name: 'Continue' }).click()

// Step 2 Abilities — standard array is STR DEX CON INT WIS CHA = 15,14,13,12,10,8
// For Rogue we want DEX highest. Remap after standard array.
await page.getByRole('button', { name: 'Use standard array' }).click()
// Set a classic rogue spread: DEX 15, CON 14, CHA 13, WIS 12, INT 10, STR 8
const setAbility = async (label, value) => {
  const cell = page.locator('.ability-cell', { hasText: label })
  await cell.locator('input').fill(String(value))
}
await setAbility('STR', 8)
await setAbility('DEX', 15)
await setAbility('CON', 14)
await setAbility('INT', 10)
await setAbility('WIS', 12)
await setAbility('CHA', 13)
await shot('rogue_step2_abilities')

await page.getByRole('button', { name: 'Continue' }).click()

// Step 3 Skills — Rogues typically take Stealth, Sleight of Hand, Acrobatics, Perception, Deception, Insight etc.
for (const skill of ['Acrobatics', 'Deception', 'Perception', 'Sleight of Hand', 'Stealth', 'Investigation']) {
  await page.getByLabel(new RegExp(`^${skill}`)).check()
}
await shot('rogue_step3_skills')

await page.getByRole('button', { name: 'Continue' }).click()

// Step 4 Details
await page.locator('label', { hasText: 'Armor class' }).locator('input').fill('14') // leather + dex
await page
  .locator('label', { hasText: 'Starting gear note' })
  .locator('input')
  .fill("Rapier, shortbow, thieves' tools, burglar's pack, leather armor")
await page
  .locator('label', { hasText: 'Personality traits' })
  .locator('textarea')
  .fill('I always have an exit plan. I smile while I pick your pocket.')
await page.locator('label', { hasText: 'Ideals' }).locator('textarea').fill('Freedom — chains are made to be broken.')
await page.locator('label', { hasText: 'Bonds' }).locator('textarea').fill('I owe my mentor a debt I can never fully repay.')
await page.locator('label', { hasText: 'Flaws' }).locator('textarea').fill('If there\'s a shiny thing, I take it first and apologize later.')
await shot('rogue_step4_details')

await page.getByRole('button', { name: 'Save character' }).click()
await page.waitForURL('**/characters/**')
await page.waitForSelector('h1')
await page.waitForTimeout(400)
await shot('rogue_sheet_ready')

console.log(JSON.stringify({
  url: page.url(),
  name: await page.locator('h1').innerText(),
  meta: await page.locator('.sheet-header .meta').innerText(),
}))

await browser.close()
