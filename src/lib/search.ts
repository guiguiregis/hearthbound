import { ABILITY_LABELS, ABILITY_SHORT, SKILLS } from '../data/dnd'
import {
  abilityModifier,
  formatModifier,
  savingThrowModifier,
  skillModifier,
} from './stats'
import type { Character } from '../types/character'

export type SheetTab = 'combat' | 'skills' | 'features' | 'gear' | 'magic' | 'story' | 'dice'

export interface SearchHit {
  id: string
  tab: SheetTab
  category: string
  title: string
  snippet: string
  /** Prominent modifier / bonus shown in search results, e.g. "+6". */
  bonus?: string
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
  bonus?: string,
) {
  const blob = `${title} ${snippet} ${category} ${bonus ?? ''}`
  if (!includes(blob, query)) return
  hits.push({
    id,
    tab,
    category,
    title,
    snippet: snippet.trim(),
    bonus: bonus?.trim() || undefined,
  })
}

/** Search one character's sheet fields for a query string. */
export function searchCharacter(character: Character, rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const hits: SearchHit[] = []
  const prof = formatModifier(character.proficiencyBonus)

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
    `Prof ${prof}`,
  )

  push(
    hits,
    'vitals',
    'combat',
    'Vitals',
    'HP / AC / Initiative',
    `HP ${character.hp.current}/${character.hp.max} · AC ${character.armorClass} · Speed ${character.speed}`,
    query,
    `Init ${formatModifier(character.initiative)}`,
  )

  push(
    hits,
    'proficiency',
    'combat',
    'Bonus',
    'Proficiency bonus',
    `Level ${character.level}`,
    query,
    prof,
  )

  push(
    hits,
    'initiative',
    'combat',
    'Bonus',
    'Initiative',
    'Dexterity-based initiative modifier',
    query,
    formatModifier(character.initiative),
  )

  for (const key of ABILITY_SHORT) {
    const score = character.abilities[key]
    const mod = abilityModifier(score)
    push(
      hits,
      `ability-${key}`,
      'combat',
      'Ability',
      ABILITY_LABELS[key],
      `Score ${score}`,
      query,
      formatModifier(mod),
    )
  }

  for (const key of ABILITY_SHORT) {
    const proficient = character.savingThrowProficiencies.includes(key)
    const mod = savingThrowModifier(
      character.abilities,
      key,
      proficient,
      character.proficiencyBonus,
    )
    push(
      hits,
      `save-${key}`,
      'combat',
      'Saving throw',
      `${ABILITY_LABELS[key]} save`,
      proficient ? 'Proficient' : 'Not proficient',
      query,
      formatModifier(mod),
    )
  }

  for (const attack of character.attacks ?? []) {
    const bonusLabel = /[+-]?\d/.test(attack.bonus) ? attack.bonus : undefined
    push(
      hits,
      `attack-${attack.id}`,
      'combat',
      'Attack',
      attack.name,
      `${attack.damage}${attack.notes ? ` · ${attack.notes}` : ''}`,
      query,
      bonusLabel ? `${bonusLabel} to hit` : undefined,
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
      `${skill.ability.toUpperCase()}${expertise ? ' · Expertise' : proficient ? ' · Proficient' : ''}`,
      query,
      formatModifier(mod),
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
      feature.recovers,
      uses && uses.total > 0 ? `Uses ${uses.used}/${uses.total}` : '',
      feature.description,
    ]
      .filter(Boolean)
      .join(' · ')
    push(
      hits,
      `feature-${feature.id}`,
      'features',
      'Feature',
      feature.name,
      meta,
      query,
      feature.value || undefined,
    )
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
      `${currency.sp} SP · ${currency.cp} CP · ${currency.ep} EP · ${currency.pp} PP`,
      query,
      `${currency.gp} GP`,
    )
  }

  for (const spell of character.spells ?? []) {
    push(
      hits,
      `spell-${spell.id}`,
      'magic',
      'Spell',
      spell.name,
      spell.prepared ? 'Prepared' : 'Not prepared',
      query,
      spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}`,
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
      [
        appearance.age && `Age ${appearance.age}`,
        appearance.height,
        appearance.weight && `${appearance.weight} lb`,
        appearance.eyes && `${appearance.eyes} eyes`,
        appearance.skin,
        appearance.hair,
        appearance.marks,
      ]
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
    push(hits, `note-${note.id}`, 'story', 'Session note', note.title, note.body, query)
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
