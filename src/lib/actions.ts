import { ABILITY_LABELS, ABILITY_SHORT, SKILLS } from '../data/dnd'
import { extractFlatBonus, parseDamageExpression, sneakAttackDice } from './dice'
import {
  abilityModifier,
  formatModifier,
  savingThrowModifier,
  skillModifier,
} from './stats'
import type { AbilityKey, Character, SkillKey } from '../types/character'

export type ActionKind = 'attack' | 'damage' | 'check' | 'save' | 'initiative' | 'feature'

export type ModMode =
  | 'none'
  | 'custom'
  | 'ability'
  | 'save'
  | 'skill'
  | 'attack'
  | 'initiative'
  | 'proficiency'

export interface ActionPreset {
  notation: string
  modMode: ModMode
  ability?: AbilityKey
  skill?: SkillKey
  attackId?: string
  customMod?: number
}

export interface SuggestedAction {
  id: string
  kind: ActionKind
  title: string
  situation: string
  rollLabel: string
  bonusLabel: string
  hint?: string
  preset: ActionPreset
}

function attackHitBonus(bonusText: string): number {
  return extractFlatBonus(bonusText)
}

/** Build situational roll suggestions from the character sheet. */
export function suggestActions(character: Character): SuggestedAction[] {
  const actions: SuggestedAction[] = []

  actions.push({
    id: 'initiative',
    kind: 'initiative',
    title: 'Roll initiative',
    situation: 'Combat is starting — determine turn order.',
    rollLabel: '1d20',
    bonusLabel: formatModifier(character.initiative),
    preset: { notation: '1d20', modMode: 'initiative' },
  })

  for (const attack of character.attacks ?? []) {
    const hitBonus = attackHitBonus(attack.bonus)
    const isSneakOnly = /sneak\s*attack/i.test(attack.name) && !/[+-]?\d/.test(attack.bonus.replace('—', ''))

    if (!isSneakOnly && attack.bonus && attack.bonus !== '—') {
      actions.push({
        id: `hit-${attack.id}`,
        kind: 'attack',
        title: `Attack — ${attack.name}`,
        situation: `To-hit roll with ${attack.name}.`,
        rollLabel: '1d20',
        bonusLabel: `${formatModifier(hitBonus)} to hit`,
        hint: attack.notes,
        preset: {
          notation: '1d20',
          modMode: 'attack',
          attackId: attack.id,
        },
      })
    }

    const damage = parseDamageExpression(attack.damage)
    if (damage.notation) {
      actions.push({
        id: `dmg-${attack.id}`,
        kind: 'damage',
        title: `Damage — ${attack.name}`,
        situation: `You already hit. Roll damage for ${attack.name}.`,
        rollLabel: damage.notation,
        bonusLabel:
          damage.bonus !== 0 ? `${formatModifier(damage.bonus)} damage` : 'no flat bonus',
        hint: attack.damage,
        preset: {
          notation: damage.notation,
          modMode: damage.bonus !== 0 ? 'custom' : 'none',
          customMod: damage.bonus,
        },
      })
    }
  }

  // Prefer sheet feature value; fall back to SRD progression by level for Rogues.
  const sneakFeature = character.features.find((f) => /sneak\s*attack/i.test(f.name))
  const sneakFromFeature = sneakFeature?.value
    ? parseDamageExpression(sneakFeature.value).notation
    : null
  const sneakDice =
    sneakFromFeature ??
    (character.className.toLowerCase() === 'rogue' ? sneakAttackDice(character.level) : null)

  if (sneakDice) {
    actions.push({
      id: 'sneak-attack',
      kind: 'feature',
      title: 'Sneak Attack damage',
      situation:
        'Once per turn when you hit with a finesse/ranged attack and have advantage (or an ally within 5 ft of the target).',
      rollLabel: sneakDice,
      bonusLabel: 'extra damage',
      hint: sneakFeature?.description,
      preset: { notation: sneakDice, modMode: 'none' },
    })
  }

  for (const feature of character.features ?? []) {
    if (/sneak\s*attack/i.test(feature.name)) continue
    const parsed = feature.value ? parseDamageExpression(feature.value) : { notation: null, bonus: 0 }
    if (!parsed.notation) continue
    actions.push({
      id: `feature-${feature.id}`,
      kind: 'feature',
      title: feature.name,
      situation: feature.action
        ? `Use as a ${feature.action.toLowerCase()}.`
        : 'Feature roll from your sheet.',
      rollLabel: parsed.notation,
      bonusLabel: parsed.bonus ? formatModifier(parsed.bonus) : feature.value || 'feature dice',
      hint: feature.description,
      preset: {
        notation: parsed.notation,
        modMode: parsed.bonus ? 'custom' : 'none',
        customMod: parsed.bonus,
      },
    })
  }

  for (const skill of SKILLS) {
    const proficient = character.skillProficiencies.includes(skill.key)
    const expertise = (character.skillExpertise ?? []).includes(skill.key)
    if (!proficient && !expertise) continue
    const mod = skillModifier(
      character.abilities,
      skill.key,
      proficient,
      character.proficiencyBonus,
      expertise,
    )
    actions.push({
      id: `skill-${skill.key}`,
      kind: 'check',
      title: `${skill.label} check`,
      situation: `Ability check using ${skill.label} (${skill.ability.toUpperCase()}).`,
      rollLabel: '1d20',
      bonusLabel: formatModifier(mod),
      preset: { notation: '1d20', modMode: 'skill', skill: skill.key },
    })
  }

  for (const key of ABILITY_SHORT) {
    const proficient = character.savingThrowProficiencies.includes(key)
    const mod = savingThrowModifier(
      character.abilities,
      key,
      proficient,
      character.proficiencyBonus,
    )
    actions.push({
      id: `save-${key}`,
      kind: 'save',
      title: `${ABILITY_LABELS[key]} saving throw`,
      situation: proficient
        ? `Proficient ${ABILITY_LABELS[key]} save.`
        : `${ABILITY_LABELS[key]} saving throw.`,
      rollLabel: '1d20',
      bonusLabel: formatModifier(mod),
      preset: { notation: '1d20', modMode: 'save', ability: key },
    })
  }

  for (const key of ABILITY_SHORT) {
    const mod = abilityModifier(character.abilities[key])
    actions.push({
      id: `ability-${key}`,
      kind: 'check',
      title: `${ABILITY_LABELS[key]} check`,
      situation: `Straight ${ABILITY_LABELS[key]} ability check (no skill).`,
      rollLabel: '1d20',
      bonusLabel: formatModifier(mod),
      preset: { notation: '1d20', modMode: 'ability', ability: key },
    })
  }

  return actions
}

export function filterActions(actions: SuggestedAction[], query: string): SuggestedAction[] {
  const q = query.trim().toLowerCase()
  if (!q) return actions
  return actions.filter((a) =>
    `${a.title} ${a.situation} ${a.kind} ${a.rollLabel} ${a.bonusLabel} ${a.hint ?? ''}`
      .toLowerCase()
      .includes(q),
  )
}
