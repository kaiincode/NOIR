import { exportRatios, type exportThemes } from './constants'
import type { ExportRatio, ExportTheme } from './types'

function wrapLine(line: string, maxChars: number) {
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [line]

  const out: string[] = []
  let cur = ''
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word
    if (next.length <= maxChars) {
      cur = next
    } else {
      if (cur) out.push(cur)
      cur = word
    }
  }
  if (cur) out.push(cur)
  return out.length ? out : [line]
}

function buildPoemSvg(opts: {
  width: number
  height: number
  background: string
  foreground: string
  title: string
  poem: string
  logoDataUrl?: string
}) {
  const { width, height, background, foreground } = opts
  const padX = Math.round(width * 0.085)
  const padTop = Math.round(height * 0.085)
  const title = opts.title.trim()
  const poem = opts.poem.trim()
  const sansStack =
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif"
  const serifStack = "ui-serif, 'Times New Roman', Times, Georgia, Cambria, 'Noto Serif', serif"
  const esc = (s: string) =>
    s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  const rawLines = poem.split('\n')
  const startY = title ? padTop + 76 : padTop
  const bottomSafe = Math.round(height * 0.16)
  const availableHeight = height - bottomSafe - startY

  const layoutWith = (fontSize: number, lineHeight: number, maxChars: number) => {
    const lines = rawLines.flatMap((line) => (line.trim() ? wrapLine(line, maxChars) : ['']))
    const maxLinesPerCol = Math.max(1, Math.floor(availableHeight / lineHeight))
    const needsTwoCols = width > height * 0.75 && lines.length > maxLinesPerCol
    return { lines, fontSize, lineHeight, maxLinesPerCol, needsTwoCols }
  }

  let layout = layoutWith(34, 46, width < 1080 ? 34 : 44)
  if (layout.needsTwoCols) layout = layoutWith(32, 43, 30)
  if (layout.lines.length > layout.maxLinesPerCol * (layout.needsTwoCols ? 2 : 1)) {
    layout = layoutWith(28, 38, 34)
  }

  const maxLinesTotal = layout.maxLinesPerCol * (layout.needsTwoCols ? 2 : 1)
  const lines =
    layout.lines.length > maxLinesTotal
      ? [...layout.lines.slice(0, Math.max(1, maxLinesTotal - 1)), '...']
      : layout.lines

  const renderLine = (line: string, x: number, y: number) =>
    line
      ? `<text x="${x}" y="${y}" fill="${foreground}" font-family="${serifStack}" font-size="${layout.fontSize}" font-weight="500">${esc(
          line,
        )}</text>`
      : ''

  const poemLines = (() => {
    if (!layout.needsTwoCols) {
      return lines.map((line, idx) => renderLine(line, padX, startY + idx * layout.lineHeight)).join('')
    }

    const colGap = 56
    const colWidth = (width - padX * 2 - colGap) / 2
    const first = lines.slice(0, layout.maxLinesPerCol)
    const second = lines.slice(layout.maxLinesPerCol)

    return [
      ...first.map((line, idx) => renderLine(line, padX, startY + idx * layout.lineHeight)),
      ...second.map((line, idx) =>
        renderLine(line, padX + colWidth + colGap, startY + idx * layout.lineHeight),
      ),
    ].join('')
  })()

  const titleBlock = title
    ? `<text x="${padX}" y="${padTop}" fill="${foreground}" font-family="${sansStack}" font-size="44" font-weight="800">${esc(
        title,
      )}</text>`
    : ''

  const footer = opts.logoDataUrl
    ? `<image href="${opts.logoDataUrl}" x="${padX}" y="${height - Math.round(height * 0.12)}" width="88" height="88" opacity="0.86" />`
    : `<text x="${padX}" y="${height - 90}" fill="${foreground}" opacity="0.55" font-family="${sansStack}" font-size="22" font-weight="700" letter-spacing="0.32em">NOIR</text>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${background}"/>
  ${titleBlock}
  ${poemLines}
  ${footer}
</svg>`
}

async function imageToDataUrl(url: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read image asset'))
    reader.readAsDataURL(blob)
  })
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'noir-poem'
  )
}

export function resolveExportTheme(exportTheme: ExportTheme, currentTheme: string | undefined) {
  return exportTheme === 'auto' ? currentTheme === 'dark' : exportTheme === 'dark'
}

export async function renderPoemPng(opts: {
  title: string
  poem: string
  exportRatio: ExportRatio
  useDark: boolean
}) {
  const ratio = exportRatios[opts.exportRatio]
  const logoDataUrl = await imageToDataUrl(opts.useDark ? '/logo-dark.png' : '/logo-light.png')
  const svg = buildPoemSvg({
    width: ratio.width,
    height: ratio.height,
    background: opts.useDark ? '#000000' : '#ffffff',
    foreground: opts.useDark ? '#ffffff' : '#0a0a0a',
    title: opts.title,
    poem: opts.poem,
    logoDataUrl,
  })

  const img = new Image()
  img.decoding = 'async'
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to render image'))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })

  const canvas = document.createElement('canvas')
  canvas.width = ratio.width
  canvas.height = ratio.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unsupported')
  ctx.drawImage(img, 0, 0)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => (nextBlob ? resolve(nextBlob) : reject(new Error('Failed to export PNG'))),
      'image/png',
    )
  })

  return {
    blob,
    dataUrl: canvas.toDataURL('image/png'),
    filename: `${slugify(opts.title)}-${opts.exportRatio}-${Date.now()}.png`,
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
