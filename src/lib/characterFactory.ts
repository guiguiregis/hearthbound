import { CLASSES } from '../data/dnd'
import type { AbilityScores, Character, CharacterDraft, SkillKey } from '../types/character'
import { defaultInitiative, proficiencyBonusForLevel, suggestedMaxHp } from './stats'
import { uid } from './storage'

export function emptyAbilities(): AbilityScores {
  return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
}

export function emptyAppearance() {
  return { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', marks: '' }
}

export function emptyCurrency() {
  return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
}

export function createDraft(): CharacterDraft {
  return {
    name: '',
    race: 'Human',
    className: 'Fighter',
    subclass: '',
    background: 'Soldier',
    alignment: 'True Neutral',
    level: 1,
    experience: 0,
    abilities: emptyAbilities(),
    skillProficiencies: [],
    skillExpertise: [],
    savingThrowProficiencies: ['str', 'con'],
    hp: { current: 10, max: 10, temp: 0 },
    armorClass: 10,
    speed: 30,
    hitDice: '1d10',
    inspiration: false,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    features: [],
    attacks: [],
    inventory: [],
    spells: [],
    spellSlots: {},
    appearance: emptyAppearance(),
    currency: emptyCurrency(),
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    sessionNotes: '',
    sessionLog: [],
  }
}

export function applyClassDefaults(draft: CharacterDraft, className: string): CharacterDraft {
  const cls = CLASSES.find((c) => c.name === className)
  if (!cls) return { ...draft, className }

  const max = suggestedMaxHp(cls.hitDie, draft.abilities.con, draft.level)
  return {
    ...draft,
    className,
    savingThrowProficiencies: [...cls.saves],
    hitDice: `${draft.level}d${cls.hitDie}`,
    hp: { ...draft.hp, max, current: Math.min(draft.hp.current || max, max) },
  }
}

export function finalizeCharacter(draft: CharacterDraft): Character {
  const now = new Date().toISOString()
  const proficiencyBonus = proficiencyBonusForLevel(draft.level)
  const initiative = draft.initiative ?? defaultInitiative(draft.abilities)

  return {
    ...draft,
    id: uid(),
    proficiencyBonus,
    initiative,
    subclass: draft.subclass ?? '',
    skillProficiencies: draft.skillProficiencies as SkillKey[],
    skillExpertise: draft.skillExpertise ?? [],
    attacks: draft.attacks ?? [],
    appearance: draft.appearance ?? emptyAppearance(),
    currency: draft.currency ?? emptyCurrency(),
    sessionLog: draft.sessionLog ?? [],
    createdAt: now,
    updatedAt: now,
  }
}

export function touch(character: Character, patch: Partial<Character>): Character {
  return {
    ...character,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
}
