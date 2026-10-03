import { ABILITY_LABELS, SKILLS } from '../data/dnd'
import { formatModifier, skillModifier } from './stats'
import type { Character } from '../types/character'

export type SheetTab = 'combat' | 'skills' | 'features' | 'gear' | 'magic' | 'story'

export interface SearchHit {
  id: string
  tab: SheetTab
  category: string
  title: string
  snippet: string
}

function includes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle)
}

function push(
  hits: SearchHit[],
  id: string,
  tab: SheetTab,
  category: string,
  title: string,
  snippet: string,
  query: string,
) {
  const blob = `${title} ${snippet} ${category}`
  if (!includes(blob, query)) return
  hits.push({ id, tab, category, title, snippet: snippet.trim() })
}

/** Search one character's sheet fields for a query string. */
export function searchCharacter(character: Character, rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const hits: SearchHit[] = []

  push(
    hits,
    'identity',
    'combat',
    'Identity',
    character.name,
    `Level ${character.level} ${character.race} ${character.className}${
      character.subclass ? ` (${character.subclass})` : ''
    } · ${character.background} · ${character.alignment}`,
    query,
  )

  push(
    hits,
    'vitals',
    'combat',
    'Vitals',
    'HP / AC / Initiative',
    `HP ${character.hp.current}/${character.hp.max} · AC ${character.armorClass} · Init ${formatModifier(character.initiative)} · Speed ${character.speed} · Prof ${formatModifier(character.proficiencyBonus)}`,
    query,
  )

  for (const [key, score] of Object.entries(character.abilities)) {
    const label = ABILITY_LABELS[key as keyof typeof ABILITY_LABELS]
    push(hits, `ability-${key}`, 'combat', 'Ability', label, `Score ${score}`, query)
  }

  for (const attack of character.attacks ?? []) {
    push(
      hits,
      `attack-${attack.id}`,
      'combat',
      'Attack',
      attack.name,
      `${attack.bonus} to hit · ${attack.damage}${attack.notes ? ` · ${attack.notes}` : ''}`,
      query,
    )
  }

  for (const skill of SKILLS) {
    const proficient = character.skillProficiencies.includes(skill.key)
    const expertise = (character.skillExpertise ?? []).includes(skill.key)
    const mod = skillModifier(
      character.abilities,
      skill.key,
      proficient,
      character.proficiencyBonus,
      expertise,
    )
    push(
      hits,
      `skill-${skill.key}`,
      'skills',
      'Skill',
      skill.label,
      `${formatModifier(mod)}${expertise ? ' · Expertise' : proficient ? ' · Proficient' : ''}`,
      query,
    )
  }

  for (const feature of character.features ?? []) {
    const uses = feature.uses
    const meta = [
      feature.className,
      feature.level != null ? `L${feature.level}` : '',
      feature.action,
      feature.range,
      feature.duration,
      feature.value,
      feature.recovers,
      uses && uses.total > 0 ? `Uses ${uses.used}/${uses.total}` : '',
      feature.description,
    ]
      .filter(Boolean)
      .join(' · ')
    push(hits, `feature-${feature.id}`, 'features', 'Feature', feature.name, meta, query)
  }

  for (const item of character.inventory ?? []) {
    push(
      hits,
      `item-${item.id}`,
      'gear',
      'Item',
      item.name,
      `×${item.qty}${item.notes ? ` · ${item.notes}` : ''}`,
      query,
    )
  }

  const currency = character.currency
  if (currency) {
    push(
      hits,
      'currency',
      'gear',
      'Currency',
      'Coins',
      `${currency.gp} GP · ${currency.sp} SP · ${currency.cp} CP · ${currency.ep} EP · ${currency.pp} PP`,
      query,
    )
  }

  for (const spell of character.spells ?? []) {
    push(
      hits,
      `spell-${spell.id}`,
      'magic',
      'Spell',
      spell.name,
      spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`,
      query,
    )
  }

  const appearance = character.appearance
  if (appearance) {
    push(
      hits,
      'appearance',
      'story',
      'Appearance',
      character.name,
      [appearance.age && `Age ${appearance.age}`, appearance.height, appearance.weight && `${appearance.weight} lb`, appearance.eyes && `${appearance.eyes} eyes`, appearance.skin, appearance.hair, appearance.marks]
        .filter(Boolean)
        .join(' · '),
      query,
    )
  }

  const p = character.personality
  push(hits, 'traits', 'story', 'Personality', 'Traits', p.traits, query)
  push(hits, 'ideals', 'story', 'Personality', 'Ideals', p.ideals, query)
  push(hits, 'bonds', 'story', 'Personality', 'Bonds', p.bonds, query)
  push(hits, 'flaws', 'story', 'Personality', 'Flaws', p.flaws, query)

  if (character.sessionNotes) {
    push(hits, 'scratch', 'story', 'Scratch pad', 'Scratch pad', character.sessionNotes, query)
  }

  for (const note of character.sessionLog ?? []) {
    push(
      hits,
      `note-${note.id}`,
      'story',
      'Session note',
      note.title,
      note.body,
      query,
    )
  }

  for (const condition of character.conditions ?? []) {
    push(hits, `condition-${condition}`, 'combat', 'Condition', condition, 'Active condition', query)
  }

  return hits
}

export function searchRoster(
  characters: Character[],
  rawQuery: string,
): Array<SearchHit & { characterId: string; characterName: string }> {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  return characters.flatMap((character) =>
    searchCharacter(character, query).map((hit) => ({
      ...hit,
      characterId: character.id,
      characterName: character.name,
    })),
  )
}
