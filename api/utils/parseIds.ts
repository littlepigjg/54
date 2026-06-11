import type { Request } from 'express'

export interface ParseIdsResult {
  ids: string[] | undefined
  explicit: boolean
  source: 'query' | 'body' | 'none'
  rawQuery?: string
  rawBody?: unknown
}

export function parseIds(req: Request): ParseIdsResult {
  const queryIds = req.query.ids as string | undefined
  const bodyIds = req.body?.ids

  if (queryIds !== undefined && queryIds !== null) {
    const raw = String(queryIds)
    const arr = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[parseIds] query ids: "${raw}" (length=${raw.length}) → parsed ${arr.length} ids`)
    }
    return {
      ids: arr,
      explicit: true,
      source: 'query',
      rawQuery: raw,
    }
  }

  if (bodyIds !== undefined && bodyIds !== null) {
    if (Array.isArray(bodyIds)) {
      const arr = bodyIds.map((s) => String(s).trim()).filter((s) => s.length > 0)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[parseIds] body ids array, length=${bodyIds.length} → parsed ${arr.length} ids`)
      }
      return {
        ids: arr,
        explicit: true,
        source: 'body',
        rawBody: bodyIds,
      }
    }
    if (typeof bodyIds === 'string') {
      const raw = bodyIds
      const arr = raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[parseIds] body ids string: "${raw}" (length=${raw.length}) → parsed ${arr.length} ids`)
      }
      return {
        ids: arr,
        explicit: true,
        source: 'body',
        rawBody: raw,
      }
    }
    console.warn(`[parseIds] body.ids 类型异常: ${typeof bodyIds}, value=`, bodyIds)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[parseIds] no ids parameter found, will export all')
  }
  return {
    ids: undefined,
    explicit: false,
    source: 'none',
  }
}

export function parseFormat(
  req: Request,
): 'zip' | 'csv' | 'scans_csv' | 'full' {
  const queryFormat = req.query.format as string | undefined
  const bodyFormat = req.body?.format as string | undefined
  const format = (queryFormat || bodyFormat || 'zip') as string
  if (['zip', 'csv', 'scans_csv', 'full'].includes(format)) {
    return format as 'zip' | 'csv' | 'scans_csv' | 'full'
  }
  console.warn(`[parseFormat] 未知 format: ${format}, fallback to zip`)
  return 'zip'
}
