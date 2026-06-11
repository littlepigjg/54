import archiver from 'archiver'
import { PassThrough } from 'node:stream'
import { QrService } from './QrService.js'
import { StatsService } from './StatsService.js'
import { qrCodeRepository } from '../repositories/QrCodeRepository.js'
import type { QrCode, ScanRecord } from '../../shared/types.js'

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const head = headers.map(escapeCsv).join(',')
  const body = rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
  return head + (body ? '\n' + body : '')
}

export const ExportService = {
  async createQrCodePngsZip(qrcodeIds?: string[]): Promise<PassThrough> {
    let qrcodes: QrCode[]
    if (qrcodeIds && qrcodeIds.length > 0) {
      qrcodes = []
      for (const id of qrcodeIds) {
        const qr = await qrCodeRepository.getById(id)
        if (qr) qrcodes.push(qr)
      }
    } else {
      qrcodes = await qrCodeRepository.getAll()
    }

    const archive = archiver('zip', { zlib: { level: 9 } })
    const stream = new PassThrough()
    archive.pipe(stream)

    const usedNames = new Map<string, number>()
    for (const qr of qrcodes) {
      let baseName = qr.name || qr.shortCode
      baseName = baseName.replace(/[<>:"/\\|?*]/g, '_')
      let filename = `${baseName}.png`
      const count = usedNames.get(filename) || 0
      if (count > 0) {
        filename = `${baseName}_${count}.png`
      }
      usedNames.set(filename, count + 1)
      try {
        const buf = await QrService.generatePngBuffer(qr)
        archive.append(buf, { name: filename })
      } catch {
        // 跳过失败的
      }
    }

    void archive.finalize()
    return stream
  },

  async buildStatsCsv(qrcodeIds?: string[]): Promise<string> {
    let qrcodes: QrCode[]
    if (qrcodeIds && qrcodeIds.length > 0) {
      qrcodes = []
      for (const id of qrcodeIds) {
        const qr = await qrCodeRepository.getById(id)
        if (qr) qrcodes.push(qr)
      }
    } else {
      qrcodes = await qrCodeRepository.getAll()
    }

    const headers = [
      'ID',
      '名称',
      '类型',
      '短码',
      '目标URL',
      '启用状态',
      '扫描次数',
      '创建时间',
      '更新时间',
    ]
    const rows: (string | number)[][] = []
    for (const qr of qrcodes) {
      rows.push([
        qr.id,
        qr.name,
        qr.type,
        qr.shortCode,
        qr.targetUrl,
        qr.enabled ? '启用' : '禁用',
        qr.scanCount,
        qr.createdAt,
        qr.updatedAt,
      ])
    }
    return buildCsv(headers, rows)
  },

  async buildScanRecordsCsv(qrcodeIds?: string[]): Promise<string> {
    let records: ScanRecord[]
    if (qrcodeIds && qrcodeIds.length > 0) {
      records = []
      for (const id of qrcodeIds) {
        const result = await StatsService.listScanRecords(1, 1000000, id)
        records.push(...result.items)
      }
    } else {
      const result = await StatsService.listScanRecords(1, 1000000)
      records = result.items
    }

    const headers = ['ID', '二维码ID', '短码', '时间', 'IP', 'UserAgent', '来源']
    const rows: (string | number)[][] = []
    for (const r of records) {
      rows.push([
        r.id,
        r.qrcodeId,
        r.shortCode,
        r.timestamp,
        r.ip,
        r.userAgent,
        r.referer || '',
      ])
    }
    return buildCsv(headers, rows)
  },

  async createFullExportZip(qrcodeIds?: string[]): Promise<PassThrough> {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const stream = new PassThrough()
    archive.pipe(stream)

    const statsCsv = await this.buildStatsCsv(qrcodeIds)
    archive.append(statsCsv, { name: 'qrcodes_stats.csv' })

    const scansCsv = await this.buildScanRecordsCsv(qrcodeIds)
    archive.append(scansCsv, { name: 'scan_records.csv' })

    let qrcodes: QrCode[]
    if (qrcodeIds && qrcodeIds.length > 0) {
      qrcodes = []
      for (const id of qrcodeIds) {
        const qr = await qrCodeRepository.getById(id)
        if (qr) qrcodes.push(qr)
      }
    } else {
      qrcodes = await qrCodeRepository.getAll()
    }

    const usedNames = new Map<string, number>()
    for (const qr of qrcodes) {
      let baseName = qr.name || qr.shortCode
      baseName = baseName.replace(/[<>:"/\\|?*]/g, '_')
      let filename = `qrcodes/${baseName}.png`
      const count = usedNames.get(filename) || 0
      if (count > 0) {
        filename = `qrcodes/${baseName}_${count}.png`
      }
      usedNames.set(filename, count + 1)
      try {
        const buf = await QrService.generatePngBuffer(qr)
        archive.append(buf, { name: filename })
      } catch {
        // 跳过
      }
    }

    void archive.finalize()
    return stream
  },
}
