'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { NoirHeader } from '@/components/noir/header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTheme } from 'next-themes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const languages = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' },
] as const

const viForms = [
  { value: 'free', label: 'Thơ tự do' },
  { value: 'luc-bat', label: 'Lục bát' },
  { value: 'that-ngon', label: 'Thất ngôn tứ tuyệt' },
] as const

const enForms = [
  { value: 'free', label: 'Free verse' },
  { value: 'sonnet', label: 'Sonnet (Shakespearean)' },
  { value: 'haiku', label: 'Haiku' },
] as const

const moods = ['Noir', 'Tender', 'Cinematic', 'Melancholy', 'Hopeful', 'Ironic', 'Minimal'] as const
const lengths = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
] as const

function wrapLine(line: string, maxChars: number) {
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [line]
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length <= maxChars) {
      cur = next
    } else {
      if (cur) out.push(cur)
      cur = w
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
  const padX = 96
  const padTop = 110
  const title = (opts.title || '').trim()
  const poem = (opts.poem || '').trim()
  const sansStack =
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', 'Liberation Sans', sans-serif"
  const serifStack =
    "ui-serif, 'Times New Roman', Times, Georgia, Cambria, 'Noto Serif', serif"

  const renderText = (() => {
    const rawLines = poem.split('\n')

    // Pass 1: wrap for 1-column width
    const wrapWith = (maxChars: number) => {
      const out: string[] = []
      for (const l of rawLines) {
        if (!l.trim()) {
          out.push('')
          continue
        }
        out.push(...wrapLine(l, maxChars))
      }
      return out
    }

    const startY = title ? padTop + 70 : padTop
    const bottomSafe = 210 // footer/logo + breathing room

    const layoutWith = (fontSize: number, lineHeight: number, maxChars: number) => {
      const lines = wrapWith(maxChars)
      const availableHeight = height - bottomSafe - startY
      const maxLinesPerCol = Math.max(1, Math.floor(availableHeight / lineHeight))
      const needsTwoCols = lines.length > maxLinesPerCol
      return { lines, fontSize, lineHeight, maxLinesPerCol, needsTwoCols, startY }
    }

    // Default typography
    let layout = layoutWith(34, 46, 44)

    // If it needs 2 columns, re-wrap tighter for column width
    if (layout.needsTwoCols) {
      layout = layoutWith(34, 46, 30)
    }

    // If still too long for 2 columns, shrink a bit
    if (layout.lines.length > layout.maxLinesPerCol * 2) {
      layout = layoutWith(30, 40, 32)
    }

    // If still too long, final shrink
    if (layout.lines.length > layout.maxLinesPerCol * 2) {
      layout = layoutWith(28, 36, 34)
    }

    const esc = (s: string) =>
      s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')

    const lines = layout.lines
    const maxLinesTotal = layout.maxLinesPerCol * (layout.needsTwoCols ? 2 : 1)
    const trimmed =
      lines.length > maxLinesTotal
        ? [...lines.slice(0, Math.max(1, maxLinesTotal - 1)), '…']
        : lines

    if (!layout.needsTwoCols) {
      const poemLines = trimmed
        .map((l, idx) => {
          const y = layout.startY + idx * layout.lineHeight
          if (!l) return ''
          return `<text x="${padX}" y="${y}" fill="${foreground}" font-family="${serifStack}" font-size="${layout.fontSize}" font-weight="500" letter-spacing="-0.01em">${esc(
            l,
          )}</text>`
        })
        .filter(Boolean)
        .join('')
      return { poemLines, isTwoCol: false }
    }

    const colGap = 56
    const colWidth = (width - padX * 2 - colGap) / 2
    const x1 = padX
    const x2 = padX + colWidth + colGap

    const col1 = trimmed.slice(0, layout.maxLinesPerCol)
    const col2 = trimmed.slice(layout.maxLinesPerCol)

    const renderCol = (col: string[], x: number) =>
      col
        .map((l, idx) => {
          const y = layout.startY + idx * layout.lineHeight
          if (!l) return ''
          return `<text x="${x}" y="${y}" fill="${foreground}" font-family="${serifStack}" font-size="${layout.fontSize}" font-weight="500" letter-spacing="-0.01em">${esc(
            l,
          )}</text>`
        })
        .filter(Boolean)
        .join('')

    return {
      poemLines: `${renderCol(col1, x1)}${renderCol(col2, x2)}`,
      isTwoCol: true,
    }
  })()

  const esc = (s: string) =>
    s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  const titleBlock = title
    ? `<text x="${padX}" y="${padTop}" fill="${foreground}" font-family="${sansStack}" font-size="44" font-weight="800" letter-spacing="-0.02em">${esc(
        title,
      )}</text>`
    : ''

  const footer = opts.logoDataUrl
    ? `<image href="${opts.logoDataUrl}" x="${padX}" y="${height - 176}" width="88" height="88" opacity="0.86" />`
    : `<text x="${padX}" y="${height - 90}" fill="${foreground}" opacity="0.55" font-family="${sansStack}" font-size="22" font-weight="700" letter-spacing="0.32em">NOIR</text>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${background}"/>
  ${titleBlock}
  ${renderText.poemLines}
  ${footer}
</svg>`
}

export default function NoirPage() {
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState<(typeof languages)[number]['value']>('vi')
  const [form, setForm] = useState<string>('free')
  const [mood, setMood] = useState<(typeof moods)[number]>('Noir')
  const [length, setLength] = useState<(typeof lengths)[number]['value']>('medium')
  const [mustInclude, setMustInclude] = useState('')
  const [avoidWords, setAvoidWords] = useState('')

  const [title, setTitle] = useState('')
  const [poem, setPoem] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { theme, resolvedTheme } = useTheme()
  const currentTheme = theme === 'system' ? resolvedTheme : theme

  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const mustIncludeRef = useRef<HTMLTextAreaElement | null>(null)
  const avoidWordsRef = useRef<HTMLTextAreaElement | null>(null)

  const layoutPaddingX = useMemo(() => 'px-[clamp(16px,2.6vw,32px)]', [])
  const layoutPaddingBottom = useMemo(() => 'pb-[clamp(28px,5vw,72px)]', [])

  useEffect(() => {
    const auto = (el: HTMLTextAreaElement | null, max: number) => {
      if (!el) return
      el.style.height = '0px'
      el.style.height = `${Math.min(el.scrollHeight, max)}px`
    }
    auto(promptRef.current, 520)
    auto(mustIncludeRef.current, 96)
    auto(avoidWordsRef.current, 96)
  }, [prompt, mustInclude, avoidWords])

  const availableForms = useMemo(() => (language === 'vi' ? viForms : enForms), [language])

  useEffect(() => {
    if (!availableForms.some((f) => f.value === form)) {
      setForm('free')
    }
  }, [availableForms, form])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NoirHeader />

      {/* Banner (full-bleed) */}
      <div className="w-full mb-[clamp(16px,3.2vw,34px)]">
        <div className="relative overflow-hidden">
          <div
            className="h-[220px] md:h-[320px] w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/background.png')" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.86)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.70)_72%,rgba(0,0,0,0.92)_100%)]" />

          <div className="pointer-events-none absolute inset-0">
            <div className="mx-auto flex h-full max-w-[1400px] items-end px-4 pb-8 md:px-6 md:pb-12">
              <div className="max-w-[980px]">
                <div className="text-[clamp(14px,1.6vw,20px)] font-semibold tracking-[0.18em] uppercase text-white/75">
                  new freedoms
                </div>
                <div className="mt-2 text-[clamp(34px,5.6vw,86px)] font-black leading-[0.88] tracking-[-0.04em] text-white">
                  of{' '}
                  <span className="font-serif italic font-semibold tracking-[-0.02em]">
                    imagination
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`mx-auto max-w-[1400px] ${layoutPaddingX} ${layoutPaddingBottom}`}>
        <div className="grid items-stretch gap-6 md:grid-cols-[360px_1fr]">
          {/* Controls */}
          <div className="pt-2 md:h-full">
            <div className="space-y-5 md:flex md:h-full md:flex-col md:justify-between">
              <div className="space-y-3">
                <label className="text-xs font-medium tracking-wide text-muted-foreground">PROMPT</label>
                <Textarea
                  ref={promptRef}
                  placeholder={language === 'vi' ? 'Gõ một ý, một hình ảnh, một ký ức…' : 'Type an image, a memory, a scene…'}
                  className="min-h-36 rounded-2xl bg-transparent border-border placeholder:text-muted-foreground resize-none overflow-hidden"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grow">
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-muted-foreground">LANGUAGE</label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                    <SelectTrigger className="rounded-2xl bg-transparent border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-muted-foreground">FORM</label>
                  <Select value={form} onValueChange={(v) => setForm(v as any)}>
                    <SelectTrigger className="rounded-2xl bg-transparent border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForms.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-muted-foreground">MOOD</label>
                  <Select value={mood} onValueChange={(v) => setMood(v as any)}>
                    <SelectTrigger className="rounded-2xl bg-transparent border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-muted-foreground">LENGTH</label>
                  <Select value={length} onValueChange={(v) => setLength(v as any)}>
                    <SelectTrigger className="rounded-2xl bg-transparent border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengths.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-muted-foreground">MUST INCLUDE</label>
                  <Textarea
                    ref={mustIncludeRef}
                    placeholder={language === 'vi' ? 'VD: “neon”, “mưa”, “ga tàu”' : 'e.g. “neon”, “rain”, “platform”'}
                    className="min-h-12 rounded-2xl bg-transparent border-border placeholder:text-muted-foreground resize-none overflow-hidden"
                    value={mustInclude}
                    onChange={(e) => setMustInclude(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-muted-foreground">AVOID</label>
                  <Textarea
                    ref={avoidWordsRef}
                    placeholder={language === 'vi' ? 'Từ/cụm từ muốn tránh…' : 'Words/phrases to avoid…'}
                    className="min-h-12 rounded-2xl bg-transparent border-border placeholder:text-muted-foreground resize-none overflow-hidden"
                    value={avoidWords}
                    onChange={(e) => setAvoidWords(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="h-12 w-full rounded-2xl"
                  onClick={async () => {
                    setIsGenerating(true)
                    setError(null)
                    setTitle('')
                    setPoem('')
                    try {
                      const res = await fetch('/api/poem', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prompt,
                          language,
                          form,
                          mood,
                          length,
                          mustInclude,
                          avoidWords,
                        }),
                      })
                      const data = (await res.json()) as { title?: string; poem?: string; error?: string }
                      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
                      setTitle(data.title ?? '')
                      setPoem(data.poem ?? '')
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Generation failed')
                    } finally {
                      setIsGenerating(false)
                    }
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Writing…' : 'Write poem'}
                </Button>
                {error && <div className="text-xs text-destructive">{error}</div>}
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="pt-2 md:h-full">
            <div className="flex h-full w-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <div className="text-xs font-medium tracking-wide text-muted-foreground">OUTPUT</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-9 rounded-2xl"
                    disabled={!poem || isGenerating}
                    onClick={async () => {
                      if (!poem) return
                      await navigator.clipboard.writeText([title, poem].filter(Boolean).join('\n\n'))
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 rounded-2xl"
                    disabled={!poem || isGenerating}
                    onClick={async () => {
                      if (!poem) return
                      const isDark = currentTheme === 'dark'

                      const slugify = (s: string) =>
                        s
                          .trim()
                          .toLowerCase()
                          .replace(/['"]/g, '')
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '')
                          .slice(0, 64)

                      const toDataUrl = async (url: string) => {
                        const res = await fetch(url)
                        const blob = await res.blob()
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.onload = () => resolve(String(reader.result))
                          reader.onerror = () => reject(new Error('Failed to read logo'))
                          reader.readAsDataURL(blob)
                        })
                        return dataUrl
                      }

                      const logoDataUrl = await toDataUrl(isDark ? '/logo-dark.png' : '/logo-light.png')
                      const svg = buildPoemSvg({
                        width: 1080,
                        height: 1350,
                        background: isDark ? '#000000' : '#ffffff',
                        foreground: isDark ? '#ffffff' : '#0a0a0a',
                        title,
                        poem,
                        logoDataUrl,
                      })

                      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
                      const img = new Image()
                      img.decoding = 'async'
                      img.crossOrigin = 'anonymous'
                      await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve()
                        img.onerror = () => reject(new Error('Failed to render image'))
                        img.src = svgUrl
                      })

                      const canvas = document.createElement('canvas')
                      canvas.width = 1080
                      canvas.height = 1350
                      const ctx = canvas.getContext('2d')
                      if (!ctx) throw new Error('Canvas unsupported')
                      ctx.drawImage(img, 0, 0)

                      const blob = await new Promise<Blob>((resolve, reject) => {
                        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to export PNG'))), 'image/png')
                      })

                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${slugify(title) || 'noir-poem'}-${Date.now()}.png`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    Save image
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 rounded-2xl"
                    disabled={!poem || isGenerating}
                    onClick={async () => {
                      setIsGenerating(true)
                      setError(null)
                      try {
                        const res = await fetch('/api/poem', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            prompt,
                            language,
                            form,
                            mood,
                            length,
                            mustInclude,
                            avoidWords,
                            previousPoem: poem,
                            revisionInstruction:
                              language === 'vi'
                                ? 'Giữ ý, đổi nhạc. Nhịp chắc hơn, hình ảnh sắc hơn.'
                                : 'Keep meaning, change the music. Tighter rhythm, sharper imagery.',
                          }),
                        })
                        const data = (await res.json()) as { title?: string; poem?: string; error?: string }
                        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
                        setTitle(data.title ?? title)
                        setPoem(data.poem ?? poem)
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Revision failed')
                      } finally {
                        setIsGenerating(false)
                      }
                    }}
                  >
                    Re-voice
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 pb-4 md:grid-cols-4">
                {[
                  {
                    key: 'darker',
                    label: language === 'vi' ? 'Tối hơn' : 'Darker',
                    instruction:
                      language === 'vi'
                        ? 'Làm tối hơn, noir hơn. Cắt chữ thừa. Tăng đối lập hình ảnh.'
                        : 'Make it darker, more noir. Cut filler. Increase image contrast.',
                  },
                  {
                    key: 'softer',
                    label: language === 'vi' ? 'Dịu hơn' : 'Softer',
                    instruction:
                      language === 'vi'
                        ? 'Dịu hơn, ấm hơn. Giữ tinh tế, tránh sến.'
                        : 'Softer, warmer. Keep restraint; avoid sentimentality.',
                  },
                  {
                    key: 'shorter',
                    label: language === 'vi' ? 'Ít chữ hơn' : 'Shorter',
                    instruction:
                      language === 'vi'
                        ? 'Rút gọn còn khoảng 60%. Giữ những dòng mạnh nhất.'
                        : 'Compress to ~60%. Keep only the strongest lines.',
                  },
                  {
                    key: 'more-imagery',
                    label: language === 'vi' ? 'Thêm hình ảnh' : 'More imagery',
                    instruction:
                      language === 'vi'
                        ? 'Tăng hình ảnh cụ thể (ánh sáng, chất liệu, mùi, âm). Giữ nhịp.'
                        : 'Add concrete sensory imagery (light, texture, smell, sound). Keep rhythm.',
                  },
                ].map((b) => (
                  <Button
                    key={b.key}
                    variant="outline"
                    className="h-10 rounded-2xl"
                    disabled={!poem || isGenerating}
                    onClick={async () => {
                      setIsGenerating(true)
                      setError(null)
                      try {
                        const res = await fetch('/api/poem', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            prompt,
                            language,
                            form,
                            mood,
                            length,
                            mustInclude,
                            avoidWords,
                            previousPoem: poem,
                            revisionInstruction: b.instruction,
                          }),
                        })
                        const data = (await res.json()) as { title?: string; poem?: string; error?: string }
                        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
                        setTitle(data.title ?? title)
                        setPoem(data.poem ?? poem)
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Revision failed')
                      } finally {
                        setIsGenerating(false)
                      }
                    }}
                  >
                    {b.label}
                  </Button>
                ))}
              </div>

              <div className="min-h-[320px] flex-1 whitespace-pre-wrap rounded-3xl border border-border bg-transparent p-5 font-serif text-[15px] leading-relaxed text-foreground">
                {title ? <div className="pb-3 font-black tracking-tight">{title}</div> : null}
                {poem || (language === 'vi' ? 'Thơ sẽ xuất hiện ở đây.' : 'Your poem will appear here.')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-[clamp(44px,8vw,120px)]">
          <div className="pt-[clamp(16px,3vw,36px)]">
            <div className="select-none text-center text-[clamp(160px,22vw,420px)] font-black leading-[0.78] tracking-[-0.06em] text-foreground">
              NOIR
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
