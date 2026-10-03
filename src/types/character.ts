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
  level?: number | null
  className?: string
  action?: string
  save?: string
  range?: string
  duration?: string
  value?: string
  recovers?: string
  uses?: { used: number; total: number }
}

export interface SessionNote {
  id: string
  title: string
  body: string
  createdAt: string
}

export interface Attack {
  id: string
  name: string
  bonus: string
  damage: string
  notes?: string
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

export interface Appearance {
  age: string
  height: string
  weight: string
  eyes: string
  skin: string
  hair: string
  marks: string
}

export interface Currency {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

export interface Character {
  id: string
  name: string
  race: string
  className: string
  subclass: string
  background: string
  alignment: string
  level: number
  experience: number
  abilities: AbilityScores
  proficiencyBonus: number
  skillProficiencies: SkillKey[]
  skillExpertise: SkillKey[]
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
  attacks: Attack[]
  inventory: InventoryItem[]
  spells: SpellEntry[]
  spellSlots: Record<number, { current: number; max: number }>
  appearance: Appearance
  currency: Currency
  personality: {
    traits: string
    ideals: string
    bonds: string
    flaws: string
  }
  /** Legacy single blob; still shown/edited, and migrated into sessionLog when empty. */
  sessionNotes: string
  sessionLog: SessionNote[]
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
