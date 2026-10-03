export interface DiceSpec {
  count: number
  sides: number
}

export interface DiceParseResult {
  ok: true
  spec: DiceSpec
  notation: string
}

export interface DiceParseError {
  ok: false
  error: string
}

/** Parse NdS / dS / N D S forms into a dice spec. */
export function parseDiceNotation(raw: string): DiceParseResult | DiceParseError {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!cleaned) return { ok: false, error: 'Enter a dice formula like 1d20 or 2d6.' }

  const match = cleaned.match(/^(\d*)d(\d+)$/i)
  if (!match) return { ok: false, error: 'Use NdS format, e.g. 1d20, 2d6, d8.' }

  const count = match[1] === '' ? 1 : Number(match[1])
  const sides = Number(match[2])
  if (!Number.isFinite(count) || count < 1 || count > 40) {
    return { ok: false, error: 'Dice count must be between 1 and 40.' }
  }
  if (!Number.isFinite(sides) || sides < 2 || sides > 1000) {
    return { ok: false, error: 'Die size must be between 2 and 1000.' }
  }

  return {
    ok: true,
    spec: { count, sides },
    notation: `${count}d${sides}`,
  }
}

export function emptyFaces(count: number): string[] {
  return Array.from({ length: count }, () => '')
}

export function parseFaces(faces: string[], sides: number): { ok: true; values: number[] } | { ok: false; error: string } {
  if (faces.length === 0) return { ok: false, error: 'Add at least one die face.' }
  const values: number[] = []
  for (let i = 0; i < faces.length; i++) {
    const raw = faces[i].trim()
    if (raw === '') return { ok: false, error: `Enter a result for die ${i + 1}.` }
    const n = Number(raw)
    if (!Number.isInteger(n)) return { ok: false, error: `Die ${i + 1} must be a whole number.` }
    if (n < 1 || n > sides) {
      return { ok: false, error: `Die ${i + 1} must be between 1 and ${sides}.` }
    }
    values.push(n)
  }
  return { ok: true, values }
}

export function sumDice(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

/** Pull a numeric bonus from strings like "+6" or "1d6+4 psychic". */
export function extractFlatBonus(text: string): number {
  const trimmed = text.trim()
  const plain = trimmed.match(/^[+-]?\d+$/)
  if (plain) return Number(plain[0])

  const withDice = trimmed.match(/d\d+\s*([+-]\s*\d+)/i)
  if (withDice) return Number(withDice[1].replace(/\s+/g, ''))

  const trailing = trimmed.match(/([+-]\s*\d+)\s*[a-z]*$/i)
  if (trailing && !/d\d+/i.test(trimmed.slice(0, trimmed.indexOf(trailing[1])))) {
    return Number(trailing[1].replace(/\s+/g, ''))
  }
  return 0
}

export interface RollBreakdown {
  notation: string
  faces: number[]
  diceTotal: number
  modifier: number
  modifierLabel: string
  total: number
  isNat1: boolean
  isNat20: boolean
  summary: string
}

export function buildBreakdown(
  notation: string,
  faces: number[],
  sides: number,
  modifier: number,
  modifierLabel: string,
): RollBreakdown {
  const diceTotal = sumDice(faces)
  const total = diceTotal + modifier
  const singleD20 = faces.length === 1 && sides === 20
  const isNat1 = singleD20 && faces[0] === 1
  const isNat20 = singleD20 && faces[0] === 20
  const faceText = faces.length === 1 ? `${faces[0]}` : faces.join(' + ')
  const modText =
    modifier === 0
      ? ''
      : ` ${modifier >= 0 ? '+' : '−'} ${Math.abs(modifier)}${modifierLabel ? ` (${modifierLabel})` : ''}`
  const summary = `${notation}: ${faceText} = ${diceTotal}${modText} → ${total}`

  return {
    notation,
    faces,
    diceTotal,
    modifier,
    modifierLabel,
    total,
    isNat1,
    isNat20,
    summary,
  }
}
