'use client'

import { Copy, Download, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getRevisionButtons } from '@/lib/noir/constants'
import type { Language } from '@/lib/noir/types'

type PoemEditorProps = {
  language: Language
  title: string
  poem: string
  error: string | null
  isGenerating: boolean
  isExporting: boolean
  onTitleChange: (value: string) => void
  onPoemChange: (value: string) => void
  onCopy: () => void
  onPreview: () => void
  onRevise: (instruction: string, action: string) => void
}

export function PoemEditor({
  language,
  title,
  poem,
  error,
  isGenerating,
  isExporting,
  onTitleChange,
  onPoemChange,
  onCopy,
  onPreview,
  onRevise,
}: PoemEditorProps) {
  const revisionButtons = getRevisionButtons(language)

  return (
    <section className="flex min-h-[620px] flex-col bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
        <div>
          <div className="text-sm font-semibold tracking-tight">Draft</div>
          <div className="mt-1 text-xs text-muted-foreground">Edit the poem directly, then revise or export.</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            className="h-8 rounded-lg px-3 text-xs"
            disabled={!poem || isGenerating}
            onClick={() =>
              onRevise(
                language === 'vi'
                  ? 'Giữ ý, đổi nhạc. Nhịp chắc hơn, hình ảnh sắc hơn.'
                  : 'Keep meaning, change the music. Tighter rhythm, sharper imagery.',
                'Re-voice',
              )
            }
          >
            <RefreshCcw className="h-4 w-4" />
            Re-voice
          </Button>
          <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" disabled={!poem} onClick={onCopy}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            className="h-8 rounded-lg px-3 text-xs"
            disabled={!poem || isExporting}
            onClick={onPreview}
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Rendering...' : 'Preview'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border/80 bg-muted/20 px-5 py-3">
        {revisionButtons.map((button) => (
          <Button
            key={button.key}
            variant="outline"
            className="h-8 rounded-lg border-border/70 bg-background/70 px-3 text-xs"
            disabled={!poem || isGenerating}
            onClick={() => onRevise(button.instruction, button.label)}
          >
            {button.label}
          </Button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 py-5">
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={language === 'vi' ? 'Tiêu đề' : 'Title'}
          className="h-auto border-0 bg-transparent px-0 py-0 text-[clamp(20px,2.1vw,32px)] font-black leading-tight tracking-tight shadow-none focus-visible:ring-0"
        />
        <Textarea
          value={poem}
          onChange={(event) => onPoemChange(event.target.value)}
          placeholder={
            language === 'vi'
              ? 'Thơ sẽ xuất hiện ở đây. Bạn có thể sửa trực tiếp trước khi revise hoặc export.'
              : 'Your poem will appear here. You can edit it directly before revising or exporting.'
          }
          className="min-h-[500px] flex-1 resize-none border-0 bg-transparent p-0 font-serif text-[17px] leading-[1.85] shadow-none focus-visible:ring-0"
        />
      </div>

      {error && <div className="border-t border-border/80 px-5 py-3 text-sm text-destructive">{error}</div>}
    </section>
  )
}
