const API = 'https://www.dnd5eapi.co/api/2014'

export interface SrdFeatureHint {
  name: string
  level: number
  desc: string[]
}

export async function fetchClassLevelFeatures(
  classIndex: string,
  level: number,
): Promise<SrdFeatureHint[]> {
  try {
    const res = await fetch(`${API}/classes/${classIndex.toLowerCase()}/levels/${level}`)
    if (!res.ok) return []
    const data = (await res.json()) as {
      features?: Array<{ index: string; name: string; url: string }>
    }
    const features = data.features ?? []
    const detailed = await Promise.all(
      features.slice(0, 8).map(async (f) => {
        const fr = await fetch(`https://www.dnd5eapi.co${f.url}`)
        if (!fr.ok) return null
        const body = (await fr.json()) as { name: string; level: number; desc: string[] }
        return { name: body.name, level: body.level, desc: body.desc ?? [] }
      }),
    )
    return detailed.filter((x): x is SrdFeatureHint => Boolean(x))
  } catch {
    return []
  }
}

export async function fetchSneakAttackHint(): Promise<string | null> {
  try {
    const res = await fetch(`${API}/features/sneak-attack`)
    if (!res.ok) return null
    const data = (await res.json()) as { desc?: string[] }
    return data.desc?.[0] ?? null
  } catch {
    return null
  }
}
