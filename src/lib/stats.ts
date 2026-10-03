import type { AbilityKey, AbilityScores, Character, SkillKey } from '../types/character'
import { SKILLS } from '../data/dnd'

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function proficiencyBonusForLevel(level: number): number {
  return Math.ceil(level / 4) + 1
}

export function skillModifier(
  abilities: AbilityScores,
  skill: SkillKey,
  proficient: boolean,
  proficiencyBonus: number,
): number {
  const meta = SKILLS.find((s) => s.key === skill)
  if (!meta) return 0
  const base = abilityModifier(abilities[meta.ability])
  return base + (proficient ? proficiencyBonus : 0)
}

export function savingThrowModifier(
  abilities: AbilityScores,
  ability: AbilityKey,
  proficient: boolean,
  proficiencyBonus: number,
): number {
  return abilityModifier(abilities[ability]) + (proficient ? proficiencyBonus : 0)
}

export function defaultInitiative(abilities: AbilityScores): number {
  return abilityModifier(abilities.dex)
}

export function suggestedMaxHp(hitDie: number, con: number, level: number): number {
  const conMod = abilityModifier(con)
  if (level <= 1) return Math.max(1, hitDie + conMod)
  const average = Math.floor(hitDie / 2) + 1
  return Math.max(1, hitDie + conMod + (level - 1) * (average + conMod))
}

export function hpPercent(character: Character): number {
  if (character.hp.max <= 0) return 0
  return Math.min(100, Math.round((character.hp.current / character.hp.max) * 100))
}
