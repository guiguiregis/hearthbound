export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type AbilityScores = Record<AbilityKey, number>

export type SkillKey =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival'

export type Condition =
  | 'Blinded'
  | 'Charmed'
  | 'Deafened'
  | 'Frightened'
  | 'Grappled'
  | 'Incapacitated'
  | 'Invisible'
  | 'Paralyzed'
  | 'Petrified'
  | 'Poisoned'
  | 'Prone'
  | 'Restrained'
  | 'Stunned'
  | 'Unconscious'
  | 'Exhaustion'

export interface InventoryItem {
  id: string
  name: string
  qty: number
  notes?: string
}

export interface Feature {
  id: string
  name: string
  description: string
}

export interface SpellEntry {
  id: string
  name: string
  level: number
  prepared: boolean
}

export interface DeathSaves {
  successes: number
  failures: number
}

export interface Character {
  id: string
  name: string
  race: string
  className: string
  background: string
  alignment: string
  level: number
  experience: number
  abilities: AbilityScores
  proficiencyBonus: number
  skillProficiencies: SkillKey[]
  savingThrowProficiencies: AbilityKey[]
  hp: {
    current: number
    max: number
    temp: number
  }
  armorClass: number
  initiative: number
  speed: number
  hitDice: string
  inspiration: boolean
  conditions: Condition[]
  deathSaves: DeathSaves
  features: Feature[]
  inventory: InventoryItem[]
  spells: SpellEntry[]
  spellSlots: Record<number, { current: number; max: number }>
  personality: {
    traits: string
    ideals: string
    bonds: string
    flaws: string
  }
  sessionNotes: string
  createdAt: string
  updatedAt: string
}

export type CharacterDraft = Omit<
  Character,
  'id' | 'createdAt' | 'updatedAt' | 'proficiencyBonus' | 'initiative'
> & {
  proficiencyBonus?: number
  initiative?: number
}
