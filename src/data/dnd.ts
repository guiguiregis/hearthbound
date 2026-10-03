import type { AbilityKey, Condition, SkillKey } from '../types/character'

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export const ABILITY_SHORT: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const SKILLS: { key: SkillKey; label: string; ability: AbilityKey }[] = [
  { key: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
  { key: 'animalHandling', label: 'Animal Handling', ability: 'wis' },
  { key: 'arcana', label: 'Arcana', ability: 'int' },
  { key: 'athletics', label: 'Athletics', ability: 'str' },
  { key: 'deception', label: 'Deception', ability: 'cha' },
  { key: 'history', label: 'History', ability: 'int' },
  { key: 'insight', label: 'Insight', ability: 'wis' },
  { key: 'intimidation', label: 'Intimidation', ability: 'cha' },
  { key: 'investigation', label: 'Investigation', ability: 'int' },
  { key: 'medicine', label: 'Medicine', ability: 'wis' },
  { key: 'nature', label: 'Nature', ability: 'int' },
  { key: 'perception', label: 'Perception', ability: 'wis' },
  { key: 'performance', label: 'Performance', ability: 'cha' },
  { key: 'persuasion', label: 'Persuasion', ability: 'cha' },
  { key: 'religion', label: 'Religion', ability: 'int' },
  { key: 'sleightOfHand', label: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth', label: 'Stealth', ability: 'dex' },
  { key: 'survival', label: 'Survival', ability: 'wis' },
]

export const RACES = [
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Dragonborn',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
  'Goliath',
  'Aasimar',
  'Custom',
]

export const CLASSES = [
  { name: 'Barbarian', hitDie: 12, saves: ['str', 'con'] as AbilityKey[] },
  { name: 'Bard', hitDie: 8, saves: ['dex', 'cha'] as AbilityKey[] },
  { name: 'Cleric', hitDie: 8, saves: ['wis', 'cha'] as AbilityKey[] },
  { name: 'Druid', hitDie: 8, saves: ['int', 'wis'] as AbilityKey[] },
  { name: 'Fighter', hitDie: 10, saves: ['str', 'con'] as AbilityKey[] },
  { name: 'Monk', hitDie: 8, saves: ['str', 'dex'] as AbilityKey[] },
  { name: 'Paladin', hitDie: 10, saves: ['wis', 'cha'] as AbilityKey[] },
  { name: 'Ranger', hitDie: 10, saves: ['str', 'dex'] as AbilityKey[] },
  { name: 'Rogue', hitDie: 8, saves: ['dex', 'int'] as AbilityKey[] },
  { name: 'Sorcerer', hitDie: 6, saves: ['con', 'cha'] as AbilityKey[] },
  { name: 'Warlock', hitDie: 8, saves: ['wis', 'cha'] as AbilityKey[] },
  { name: 'Wizard', hitDie: 6, saves: ['int', 'wis'] as AbilityKey[] },
]

export const BACKGROUNDS = [
  'Acolyte',
  'Criminal',
  'Folk Hero',
  'Noble',
  'Sage',
  'Soldier',
  'Outlander',
  'Entertainer',
  'Guild Artisan',
  'Hermit',
  'Sailor',
  'Charlatan',
  'Urchin',
  'Custom',
]

export const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
]

export const CONDITIONS: Condition[] = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Exhaustion',
]

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]
