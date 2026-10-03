import type { Character, SkillKey } from '../types/character'
import { uid } from './storage'

function item(name: string, qty = 1, notes?: string) {
  return { id: uid(), name, qty, notes }
}

function feature(name: string, description: string) {
  return { id: uid(), name, description }
}

/** Full paper-sheet import: Damakos, Wildhunt Shifter / Tiefling-flavored Rogue 3 Soulknife. */
export function createDamakos(): Character {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: 'Damakos',
    race: 'Shifter (Wildhunt)',
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
      feature(
        'Sneak Attack (2d6)',
        'Once per turn, extra damage on a finesse/ranged hit with advantage, or if an ally is within 5 ft of the target and you don’t have disadvantage.',
      ),
      feature(
        'Cunning Action',
        'Bonus action each turn: Dash, Disengage, or Hide.',
      ),
      feature(
        'Soulknife — Psionic Power & Psychic Blades',
        'Manifest psychic blades; Psionic Power feature (Tasha’s). Attack +6, 1d6+Dex psychic.',
      ),
      feature(
        'Darkvision 60 ft',
        'See in dim light as bright, darkness as dim, out to 60 feet.',
      ),
      feature(
        'Hellish Resistance (Tiefling)',
        'Resistance to fire damage.',
      ),
      feature(
        'Shifting — Wildhunt',
        'Bonus action to shift (or revert) for 1 minute. Gain temp HP = proficiency bonus × 2. While shifted: advantage on Wisdom checks; no creature within 30 ft can attack you with advantage unless you are incapacitated. Uses = proficiency bonus, regain on long rest.',
      ),
      feature(
        'Languages & Proficiencies',
        "Languages: Common, Infernal, Abyssal, Thieves’ Cant. Armor: light. Weapons: simple. Tools: thieves’ tools, playing card set.",
      ),
    ],
    attacks: [
      {
        id: uid(),
        name: 'Psychic Blade',
        bonus: '+6',
        damage: '1d6+4 psychic',
        notes: 'Finesse; Soulknife manifest blade',
      },
      {
        id: uid(),
        name: 'Rapier',
        bonus: '+6',
        damage: '1d8+4 piercing',
        notes: 'Finesse',
      },
      {
        id: uid(),
        name: 'Shortbow',
        bonus: '+6',
        damage: '1d6+4 piercing',
        notes: 'Range 80/320; 20 arrows',
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
      item('Leather armor', 1, 'Worn'),
      item('Rapier'),
      item('Shortbow'),
      item('Arrows', 20),
      item('Daggers', 2),
      item("Thieves' tools"),
      item('Playing card set'),
      item('Burglar’s pack', 1, 'Container'),
      item('Ball bearings', 1000),
      item('String', 1, '10 ft'),
      item('Bell'),
      item('Candles', 5),
      item('Crowbar'),
      item('Hammer'),
      item('Pitons', 10),
      item('Hooded lantern'),
      item('Oil flasks', 2),
      item('Rations', 5, 'days'),
      item('Tinderbox'),
      item('Waterskin'),
      item('Hemp rope', 1, '50 ft'),
      item('Small knife'),
      item('Map of home city'),
      item('Pet mouse'),
      item('Token of remembrance'),
      item('Common clothes', 1, 'set'),
    ],
    spells: [],
    spellSlots: {},
    appearance: {
      age: '30',
      height: "5'9\"",
      weight: '230',
      eyes: 'Black',
      skin: 'Dark blue',
      hair: 'Dark blue',
      marks: 'Filed-down horns',
    },
    currency: { cp: 0, sp: 0, ep: 0, gp: 110, pp: 0 },
    personality: {
      traits: 'Ask a lot of questions',
      ideals: 'Evil: The rich need to know what life and death are like in the gutter',
      bonds: 'I escaped my life of poverty by robbing an important person and am wanted',
      flaws: 'I will never fully trust anyone other than myself',
    },
    sessionNotes:
      'Imported from full paper sheet. Passive Perception 11 · Passive Insight 11. Race reads as Wildhunt Shifter with Tiefling Hellish Resistance / horns. Skills: Stealth +6, Investigation +5, Survival +3, Deception +3.',
    createdAt: now,
    updatedAt: now,
  }
}
