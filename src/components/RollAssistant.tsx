import { useState } from 'react'
import type { Character } from '../types/character'
import type { RollBreakdown } from '../lib/dice'
import type { SuggestedAction } from '../lib/actions'
import { ActionHelper } from './ActionHelper'
import { DiceInput } from './DiceInput'

interface RollAssistantProps {
  character: Character
  onLog?: (breakdown: RollBreakdown) => void
}

export function RollAssistant({ character, onLog }: RollAssistantProps) {
  const [selected, setSelected] = useState<SuggestedAction | null>(null)

  return (
    <div className="roll-assistant">
      <ActionHelper
        character={character}
        selectedId={selected?.id}
        onChoose={setSelected}
      />
      <DiceInput
        character={character}
        preset={selected?.preset ?? null}
        presetLabel={
          selected
            ? `${selected.title} · roll ${selected.rollLabel} · ${selected.bonusLabel}`
            : null
        }
        onLog={onLog}
      />
    </div>
  )
}
