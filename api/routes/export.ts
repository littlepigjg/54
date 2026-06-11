import { Router, type Request, type Response } from 'express'
import { ExportService } from '../services/ExportService.js'
import { BatchService } from '../services/BatchService.js'
import { parseIds, parseFormat } from '../utils/parseIds.js'

const router = Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, explicit } = parseIds(req)
    const format = parseFormat(req)

    if (explicit && ids !== undefined && ids.length === 0) {
      res.status(400).json({ success: false, error: '请至少选择一个二维码' })
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[export POST] format=${format}, explicit=${explicit}, idsCount=${ids?.length ?? 'all'}`)
    }

    if (format === 'csv') {
      const csv = await ExportService.buildStatsCsv(ids)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="qrcodes_stats_${Date.now()}.csv"`)
      res.send('\uFEFF' + csv)
      return
    }
    if (format === 'scans_csv') {
      const csv = await ExportService.buildScanRecordsCsv(ids)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="scan_records_${Date.now()}.csv"`)
      res.send('\uFEFF' + csv)
      return
    }
    if (format === 'full') {
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="full_export_${Date.now()}.zip"`)
      await ExportService.pipeFullExportZip(res, ids)
      return
    }
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="qrcodes_png_${Date.now()}.zip"`)
    await ExportService.pipeQrCodePngsZip(res, ids)
  } catch (err) {
    console.error('[export POST] error:', err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: (err as Error).message })
    }
  }
})

router.get('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1
    const pageSize = parseInt(String(req.query.pageSize || '20'), 10) || 20
    const all = await BatchService.list()
    const sorted = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const start = (page - 1) * pageSize
    const items = sorted.slice(start, start + pageSize)
    res.json({
      success: true,
      data: { items, total: sorted.length, page, pageSize },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/qrcodes/png.zip', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, explicit } = parseIds(req)
    if (explicit && ids !== undefined && ids.length === 0) {
      res.status(400).json({ success: false, error: '请至少选择一个二维码' })
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[export GET png.zip] explicit=${explicit}, idsCount=${ids?.length ?? 'all'}`)
    }
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="qrcodes_png_${Date.now()}.zip"`)
    await ExportService.pipeQrCodePngsZip(res, ids)
  } catch (err) {
    console.error('[export GET png.zip] error:', err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: (err as Error).message })
    }
  }
})

router.get('/stats.csv', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, explicit } = parseIds(req)
    if (explicit && ids !== undefined && ids.length === 0) {
      res.status(400).json({ success: false, error: '请至少选择一个二维码' })
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[export GET stats.csv] explicit=${explicit}, idsCount=${ids?.length ?? 'all'}`)
    }
    const csv = await ExportService.buildStatsCsv(ids)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="qrcodes_stats_${Date.now()}.csv"`)
    res.send('\uFEFF' + csv)
  } catch (err) {
    console.error('[export GET stats.csv] error:', err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: (err as Error).message })
    }
  }
})

router.get('/scans.csv', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, explicit } = parseIds(req)
    if (explicit && ids !== undefined && ids.length === 0) {
      res.status(400).json({ success: false, error: '请至少选择一个二维码' })
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[export GET scans.csv] explicit=${explicit}, idsCount=${ids?.length ?? 'all'}`)
    }
    const csv = await ExportService.buildScanRecordsCsv(ids)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="scan_records_${Date.now()}.csv"`)
    res.send('\uFEFF' + csv)
  } catch (err) {
    console.error('[export GET scans.csv] error:', err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: (err as Error).message })
    }
  }
})

router.get('/full.zip', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, explicit } = parseIds(req)
    if (explicit && ids !== undefined && ids.length === 0) {
      res.status(400).json({ success: false, error: '请至少选择一个二维码' })
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[export GET full.zip] explicit=${explicit}, idsCount=${ids?.length ?? 'all'}`)
    }
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="full_export_${Date.now()}.zip"`)
    await ExportService.pipeFullExportZip(res, ids)
  } catch (err) {
    console.error('[export GET full.zip] error:', err)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: (err as Error).message })
    }
  }
})

export default router
