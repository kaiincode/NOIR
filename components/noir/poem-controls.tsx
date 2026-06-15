'use client'

import { useEffect, useRef } from 'react'
import { ImagePlus, PenLine, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { enForms, languages, lengths, moods, viForms } from '@/lib/noir/constants'
import type { Language, Length, Mood } from '@/lib/noir/types'

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024

type PoemControlsProps = {
  prompt: string
  imageDataUrl: string | null
  imageName: string
  language: Language
  form: string
  mood: Mood
  length: Length
  mustInclude: string
  avoidWords: string
  isBusy: boolean
  onPromptChange: (value: string) => void
  onImageChange: (dataUrl: string, name: string) => void
  onImageClear: () => void
  onLanguageChange: (value: Language) => void
  onFormChange: (value: string) => void
  onMoodChange: (value: Mood) => void
  onLengthChange: (value: Length) => void
  onMustIncludeChange: (value: string) => void
  onAvoidWordsChange: (value: string) => void
  onWrite: () => void
}

export function PoemControls({
  prompt,
  imageDataUrl,
  imageName,
  language,
  form,
  mood,
  length,
  mustInclude,
  avoidWords,
  isBusy,
  onPromptChange,
  onImageChange,
  onImageClear,
  onLanguageChange,
  onFormChange,
  onMoodChange,
  onLengthChange,
  onMustIncludeChange,
  onAvoidWordsChange,
  onWrite,
}: PoemControlsProps) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mustIncludeRef = useRef<HTMLTextAreaElement | null>(null)
  const avoidWordsRef = useRef<HTMLTextAreaElement | null>(null)
  const availableForms = language === 'vi' ? viForms : enForms

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

  return (
    <section className="flex h-full flex-col border-b border-border/80 bg-muted/10 lg:border-b-0 lg:border-r">
      <div className="border-b border-border/70 px-5 py-4">
        <div className="text-sm font-semibold tracking-tight">Source</div>
        <div className="mt-1 text-xs text-muted-foreground">Prompt, image, and poetic constraints.</div>
      </div>

      <div className="flex-1 space-y-5 px-5 py-5">
        <Field label="Prompt">
          <Textarea
            ref={promptRef}
            placeholder={language === 'vi' ? 'Gõ một ý, một hình ảnh, một ký ức...' : 'Type an image, a memory, a scene...'}
            className="min-h-32 resize-none overflow-hidden rounded-xl border-border/80 bg-background/70 text-sm placeholder:text-muted-foreground"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Image</Label>
            {imageDataUrl && (
              <Button type="button" variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-xs" onClick={onImageClear}>
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              if (file.size > MAX_IMAGE_BYTES) {
                window.alert('Image is too large. Please choose a PNG, JPG, or WebP under 2.5MB.')
                return
              }

              const reader = new FileReader()
              reader.onload = () => onImageChange(String(reader.result), file.name)
              reader.readAsDataURL(file)
            }}
          />

          {imageDataUrl ? (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-background/70">
              <img src={imageDataUrl} alt={imageName || 'Imported poem reference'} className="aspect-[5/3] w-full object-cover" />
              <div className="truncate border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">{imageName}</div>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/90 bg-background/40 text-sm text-muted-foreground transition hover:border-foreground/40 hover:bg-background/80 hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Import image for visual poetry
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border/70 pt-5">
          <Field label="Language">
            <Select value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
              <SelectTrigger className="h-10 rounded-xl border-border/80 bg-background/70 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Form">
            <Select value={form} onValueChange={onFormChange}>
              <SelectTrigger className="h-10 rounded-xl border-border/80 bg-background/70 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableForms.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Mood">
            <Select value={mood} onValueChange={(value) => onMoodChange(value as Mood)}>
              <SelectTrigger className="h-10 rounded-xl border-border/80 bg-background/70 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moods.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Length">
            <Select value={length} onValueChange={(value) => onLengthChange(value as Length)}>
              <SelectTrigger className="h-10 rounded-xl border-border/80 bg-background/70 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lengths.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 border-t border-border/70 pt-5">
          <Field label="Must include">
            <Textarea
              ref={mustIncludeRef}
              placeholder={language === 'vi' ? 'VD: neon, mưa, ga tàu' : 'e.g. neon, rain, platform'}
              className="min-h-11 resize-none overflow-hidden rounded-xl border-border/80 bg-background/70 text-sm placeholder:text-muted-foreground"
              value={mustInclude}
              onChange={(event) => onMustIncludeChange(event.target.value)}
            />
          </Field>

          <Field label="Avoid">
            <Textarea
              ref={avoidWordsRef}
              placeholder={language === 'vi' ? 'Từ hoặc cụm từ muốn tránh...' : 'Words or phrases to avoid...'}
              className="min-h-11 resize-none overflow-hidden rounded-xl border-border/80 bg-background/70 text-sm placeholder:text-muted-foreground"
              value={avoidWords}
              onChange={(event) => onAvoidWordsChange(event.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-border/70 p-5">
        <Button className="h-11 w-full rounded-xl" onClick={onWrite} disabled={isBusy}>
          <PenLine className="h-4 w-4" />
          {isBusy ? 'Writing...' : 'Write poem'}
        </Button>
      </div>
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
