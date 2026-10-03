import type { Character, SkillKey } from '../types/character'
import { uid } from './storage'

/** Paper-sheet import: Damakos, Rogue 3 Soulknife (Urchin). */
export function createDamakos(): Character {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: 'Damakos',
    race: 'Custom',
    className: 'Rogue',
    subclass: 'Soulknife',
    background: 'Urchin',
    alignment: 'True Neutral',
    level: 3,
    experience: 0,
    abilities: { str: 12, dex: 18, con: 14, int: 17, wis: 12, cha: 12 },
    proficiencyBonus: 2,
    skillProficiencies: [
      'stealth',
      'investigation',
      'survival',
      'deception',
    ] as SkillKey[],
    // Paper: Stealth +6, Investigation +5, Survival +3, Deception +3 (prof +2, no expertise numbers).
    skillExpertise: [],
    savingThrowProficiencies: ['dex', 'int'],
    hp: { current: 35, max: 35, temp: 0 },
    armorClass: 15,
    initiative: 4,
    speed: 30,
    hitDice: '3d8',
    inspiration: false,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    features: [
      {
        id: uid(),
        name: 'Sneak Attack',
        description: '2d6 extra damage once per turn with advantage or an ally within 5 ft of the target.',
      },
      {
        id: uid(),
        name: 'Cunning Action',
        description: 'Bonus action: Dash, Disengage, or Hide.',
      },
      {
        id: uid(),
        name: 'Psionic Power / Psychic Blades',
        description: 'Soulknife archetype — manifest psychic blades; Psionic Power feature.',
      },
      {
        id: uid(),
        name: 'Racial Traits',
        description: 'Darkvision 60 ft; Hellish Resistance (Tiefling); Shifting (Shifter).',
      },
      {
        id: uid(),
        name: 'Languages & Tools',
        description:
          "Common, Infernal, Abyssal, Thieves’ Cant. Light armor; simple weapons; thieves’ tools; playing card set.",
      },
    ],
    attacks: [
      {
        id: uid(),
        name: 'Psychic Blade',
        bonus: '+6',
        damage: '1d6+4 psychic',
        notes: 'Finesse; soulknife manifest blade',
      },
      {
        id: uid(),
        name: 'Sneak Attack',
        bonus: '—',
        damage: '2d6',
        notes: 'Once per turn when conditions are met',
      },
    ],
    inventory: [
      { id: uid(), name: "Thieves' tools", qty: 1 },
      { id: uid(), name: 'Playing card set', qty: 1 },
      { id: uid(), name: 'Light armor', qty: 1 },
    ],
    spells: [],
    spellSlots: {},
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    sessionNotes:
      'Imported from paper sheet. Passive Perception 11 · Passive Insight 11. Skills from close-up: Stealth, Investigation, Survival, Deception (no expertise marked on the numbers).',
    createdAt: now,
    updatedAt: now,
  }
}
