import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { searchCharacter, type SearchHit, type SheetTab } from '../lib/search'
import type { Character } from '../types/character'

interface CharacterSearchProps {
  character: Character
  onSelect: (hit: SearchHit) => void
}

export function CharacterSearch({ character, onSelect }: CharacterSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const hits = useMemo(() => searchCharacter(character, query), [character, query])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function choose(hit: SearchHit) {
    onSelect(hit)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter') && hits.length) {
      setOpen(true)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(hits.length - 1, i + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (event.key === 'Enter' && hits[active]) {
      event.preventDefault()
      choose(hits[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="char-search" ref={rootRef}>
      <label className="char-search-label" htmlFor={`${listId}-input`}>
        Search sheet
      </label>
      <input
        id={`${listId}-input`}
        className="char-search-input"
        type="search"
        value={query}
        placeholder="Search features, gear, notes, skills…"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && query.trim().length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {open && query.trim() && (
        <div className="char-search-results" id={listId} role="listbox">
          {hits.length === 0 ? (
            <p className="meta" style={{ margin: 0, padding: '0.75rem 1rem' }}>
              No matches for “{query.trim()}”.
            </p>
          ) : (
            hits.slice(0, 12).map((hit, index) => (
              <button
                key={hit.id}
                type="button"
                role="option"
                aria-selected={index === active}
                className={`char-search-hit ${index === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(hit)}
              >
                <span className="char-search-main">
                  <span className="char-search-cat">{hit.category}</span>
                  <strong>{hit.title}</strong>
                  {hit.snippet && <span className="meta">{hit.snippet}</span>}
                </span>
                {hit.bonus ? <span className="char-search-bonus">{hit.bonus}</span> : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export type { SheetTab }
