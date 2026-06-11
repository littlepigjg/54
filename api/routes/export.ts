import { Router, type Request, type Response } from 'express'
import { ExportService } from '../services/ExportService.js'

const router = Router()

router.get('/qrcodes/png.zip', async (req: Request, res: Response): Promise<void> => {
  try {
    let ids: string[] | undefined
    const idsParam = req.query.ids as string | undefined
    if (idsParam) {
      ids = idsParam.split(',').filter(Boolean)
    }
    const stream = await ExportService.createQrCodePngsZip(ids)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="qrcodes_png_${Date.now()}.zip"`)
    stream.pipe(res)
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/stats.csv', async (req: Request, res: Response): Promise<void> => {
  try {
    let ids: string[] | undefined
    const idsParam = req.query.ids as string | undefined
    if (idsParam) {
      ids = idsParam.split(',').filter(Boolean)
    }
    const csv = await ExportService.buildStatsCsv(ids)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="qrcodes_stats_${Date.now()}.csv"`)
    res.send('\uFEFF' + csv)
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/scans.csv', async (req: Request, res: Response): Promise<void> => {
  try {
    let ids: string[] | undefined
    const idsParam = req.query.ids as string | undefined
    if (idsParam) {
      ids = idsParam.split(',').filter(Boolean)
    }
    const csv = await ExportService.buildScanRecordsCsv(ids)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="scan_records_${Date.now()}.csv"`)
    res.send('\uFEFF' + csv)
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/full.zip', async (req: Request, res: Response): Promise<void> => {
  try {
    let ids: string[] | undefined
    const idsParam = req.query.ids as string | undefined
    if (idsParam) {
      ids = idsParam.split(',').filter(Boolean)
    }
    const stream = await ExportService.createFullExportZip(ids)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="full_export_${Date.now()}.zip"`)
    stream.pipe(res)
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
