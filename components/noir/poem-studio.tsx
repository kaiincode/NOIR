'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'

import { ExportPanel } from '@/components/noir/export-panel'
import { NoirHeader } from '@/components/noir/header'
import { PoemControls } from '@/components/noir/poem-controls'
import { PoemEditor } from '@/components/noir/poem-editor'
import { VersionHistory } from '@/components/noir/version-history'
import { enForms, NOIR_STORAGE_KEY, viForms } from '@/lib/noir/constants'
import { downloadBlob, renderPoemPng, resolveExportTheme } from '@/lib/noir/export-image'
import type {
  ExportRatio,
  ExportTheme,
  Language,
  Length,
  Mood,
  PoemResponse,
  PoemStudioDraft,
  PoemVersion,
} from '@/lib/noir/types'

const defaultDraft: PoemStudioDraft = {
  prompt: '',
  imageDataUrl: null,
  imageName: '',
  language: 'vi',
  form: 'free',
  mood: 'Noir',
  length: 'medium',
  mustInclude: '',
  avoidWords: '',
  title: '',
  poem: '',
  versions: [],
  selectedVersionId: null,
  exportRatio: 'portrait',
  exportTheme: 'auto',
}

type PreviewImage = {
  dataUrl: string
  blob: Blob
  filename: string
}

function readStoredDraft(): Partial<PoemStudioDraft> | null {
  try {
    const raw = window.localStorage.getItem(NOIR_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PoemStudioDraft>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export default function PoemStudio() {
  const [prompt, setPrompt] = useState(defaultDraft.prompt)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(defaultDraft.imageDataUrl)
  const [imageName, setImageName] = useState(defaultDraft.imageName)
  const [language, setLanguage] = useState<Language>(defaultDraft.language)
  const [form, setForm] = useState(defaultDraft.form)
  const [mood, setMood] = useState<Mood>(defaultDraft.mood)
  const [length, setLength] = useState<Length>(defaultDraft.length)
  const [mustInclude, setMustInclude] = useState(defaultDraft.mustInclude)
  const [avoidWords, setAvoidWords] = useState(defaultDraft.avoidWords)
  const [title, setTitle] = useState(defaultDraft.title)
  const [poem, setPoem] = useState(defaultDraft.poem)
  const [versions, setVersions] = useState<PoemVersion[]>(defaultDraft.versions)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(defaultDraft.selectedVersionId)
  const [exportRatio, setExportRatio] = useState<ExportRatio>(defaultDraft.exportRatio)
  const [exportTheme, setExportTheme] = useState<ExportTheme>(defaultDraft.exportTheme)
  const [preview, setPreview] = useState<PreviewImage | null>(null)
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { theme, resolvedTheme } = useTheme()
  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const availableForms = useMemo(() => (language === 'vi' ? viForms : enForms), [language])

  useEffect(() => {
    const stored = readStoredDraft()
    if (stored) {
      setPrompt(stored.prompt ?? defaultDraft.prompt)
      setImageDataUrl(stored.imageDataUrl ?? defaultDraft.imageDataUrl)
      setImageName(stored.imageName ?? defaultDraft.imageName)
      setLanguage(stored.language ?? defaultDraft.language)
      setForm(stored.form ?? defaultDraft.form)
      setMood(stored.mood ?? defaultDraft.mood)
      setLength(stored.length ?? defaultDraft.length)
      setMustInclude(stored.mustInclude ?? defaultDraft.mustInclude)
      setAvoidWords(stored.avoidWords ?? defaultDraft.avoidWords)
      setTitle(stored.title ?? defaultDraft.title)
      setPoem(stored.poem ?? defaultDraft.poem)
      setVersions(Array.isArray(stored.versions) ? stored.versions.slice(0, 12) : defaultDraft.versions)
      setSelectedVersionId(stored.selectedVersionId ?? defaultDraft.selectedVersionId)
      setExportRatio(stored.exportRatio ?? defaultDraft.exportRatio)
      setExportTheme(stored.exportTheme ?? defaultDraft.exportTheme)
    }
    setHasLoadedStorage(true)
  }, [])

  useEffect(() => {
    if (!availableForms.some((item) => item.value === form)) setForm('free')
  }, [availableForms, form])

  useEffect(() => {
    if (!hasLoadedStorage) return
    const draft: PoemStudioDraft = {
      prompt,
      imageDataUrl,
      imageName,
      language,
      form,
      mood,
      length,
      mustInclude,
      avoidWords,
      title,
      poem,
      versions,
      selectedVersionId,
      exportRatio,
      exportTheme,
    }
    window.localStorage.setItem(NOIR_STORAGE_KEY, JSON.stringify(draft))
  }, [
    avoidWords,
    exportRatio,
    exportTheme,
    form,
    hasLoadedStorage,
    imageDataUrl,
    imageName,
    language,
    length,
    mood,
    mustInclude,
    poem,
    prompt,
    selectedVersionId,
    title,
    versions,
  ])

  const clearPreview = () => setPreview(null)

  const addVersion = (nextTitle: string, nextPoem: string, action: string) => {
    const version: PoemVersion = {
      id: crypto.randomUUID(),
      title: nextTitle,
      poem: nextPoem,
      action,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setVersions((current) => [version, ...current].slice(0, 12))
    setSelectedVersionId(version.id)
  }

  const requestPoem = async (revisionInstruction?: string, action = 'Draft') => {
    setIsGenerating(true)
    setError(null)
    clearPreview()

    try {
      const res = await fetch('/api/poem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageDataUrl,
          language,
          form,
          mood,
          length,
          mustInclude,
          avoidWords,
          previousPoem: revisionInstruction ? poem : undefined,
          revisionInstruction,
        }),
      })

      const data = (await res.json()) as PoemResponse
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)

      const nextTitle = data.title ?? ''
      const nextPoem = data.poem ?? ''
      setTitle(nextTitle)
      setPoem(nextPoem)
      addVersion(nextTitle, nextPoem, action)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPoem = async () => {
    if (!poem) return
    await navigator.clipboard.writeText([title, poem].filter(Boolean).join('\n\n'))
  }

  const renderPreview = async () => {
    if (!poem) return

    setIsExporting(true)
    setError(null)

    try {
      const rendered = await renderPoemPng({
        title,
        poem,
        exportRatio,
        useDark: resolveExportTheme(exportTheme, currentTheme),
      })
      setPreview(rendered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export preview failed')
    } finally {
      setIsExporting(false)
    }
  }

  const downloadPreview = async () => {
    if (preview) {
      downloadBlob(preview.blob, preview.filename)
      return
    }

    await renderPreview()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NoirHeader />

      <div className="mb-[clamp(16px,3.2vw,34px)] w-full">
        <div className="relative overflow-hidden">
          <div
            className="h-[220px] w-full bg-cover bg-center md:h-[320px]"
            style={{ backgroundImage: "url('/background.png')" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.86)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.70)_72%,rgba(0,0,0,0.92)_100%)]" />
          <div className="pointer-events-none absolute inset-0">
            <div className="mx-auto flex h-full max-w-[1400px] items-end px-4 pb-8 md:px-6 md:pb-12">
              <div className="max-w-[980px]">
                <div className="text-[clamp(14px,1.6vw,20px)] font-semibold uppercase tracking-[0.18em] text-white/75">
                  new freedoms
                </div>
                <div className="mt-2 text-[clamp(34px,5.6vw,86px)] font-black leading-[0.88] tracking-[-0.04em] text-white">
                  of <span className="font-serif font-semibold italic tracking-[-0.02em]">imagination</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-[clamp(14px,2.4vw,30px)] pb-[clamp(28px,5vw,72px)]">
        <div className="grid min-h-[720px] items-stretch overflow-hidden rounded-[28px] border border-border/80 bg-background shadow-sm lg:grid-cols-[330px_minmax(0,1fr)_300px]">
          <PoemControls
            prompt={prompt}
            imageDataUrl={imageDataUrl}
            imageName={imageName}
            language={language}
            form={form}
            mood={mood}
            length={length}
            mustInclude={mustInclude}
            avoidWords={avoidWords}
            isBusy={isGenerating || isExporting}
            onPromptChange={setPrompt}
            onImageChange={(nextDataUrl, nextName) => {
              setImageDataUrl(nextDataUrl)
              setImageName(nextName)
              clearPreview()
            }}
            onImageClear={() => {
              setImageDataUrl(null)
              setImageName('')
              clearPreview()
            }}
            onLanguageChange={(value) => {
              setLanguage(value)
              clearPreview()
            }}
            onFormChange={setForm}
            onMoodChange={setMood}
            onLengthChange={setLength}
            onMustIncludeChange={setMustInclude}
            onAvoidWordsChange={setAvoidWords}
            onWrite={() => requestPoem(undefined, 'Draft')}
          />

          <PoemEditor
            language={language}
            title={title}
            poem={poem}
            error={error}
            isGenerating={isGenerating}
            isExporting={isExporting}
            onTitleChange={(value) => {
              setTitle(value)
              clearPreview()
            }}
            onPoemChange={(value) => {
              setPoem(value)
              clearPreview()
            }}
            onCopy={copyPoem}
            onPreview={renderPreview}
            onRevise={requestPoem}
          />

          <aside className="space-y-0 border-t border-border/80 bg-muted/20 lg:border-l lg:border-t-0">
            <VersionHistory
              language={language}
              versions={versions}
              selectedVersionId={selectedVersionId}
              onSelect={(version) => {
                setSelectedVersionId(version.id)
                setTitle(version.title)
                setPoem(version.poem)
                clearPreview()
              }}
            />
            <ExportPanel
              exportRatio={exportRatio}
              exportTheme={exportTheme}
              previewUrl={preview?.dataUrl ?? null}
              isExporting={isExporting}
              hasPoem={Boolean(poem)}
              onExportRatioChange={(value) => {
                setExportRatio(value)
                clearPreview()
              }}
              onExportThemeChange={(value) => {
                setExportTheme(value)
                clearPreview()
              }}
              onPreview={renderPreview}
              onDownloadPreview={downloadPreview}
            />
          </aside>
        </div>

        <div className="pt-[clamp(44px,8vw,120px)]">
          <div className="select-none text-center text-[clamp(160px,22vw,420px)] font-black leading-[0.78] tracking-[-0.06em] text-foreground">
            NOIR
          </div>
        </div>
      </main>
    </div>
  )
}
