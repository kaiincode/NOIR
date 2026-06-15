'use client'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportRatios, exportThemes } from '@/lib/noir/constants'
import type { ExportRatio, ExportTheme } from '@/lib/noir/types'

type ExportPanelProps = {
  exportRatio: ExportRatio
  exportTheme: ExportTheme
  previewUrl: string | null
  isExporting: boolean
  hasPoem: boolean
  onExportRatioChange: (value: ExportRatio) => void
  onExportThemeChange: (value: ExportTheme) => void
  onPreview: () => void
  onDownloadPreview: () => void
}

export function ExportPanel({
  exportRatio,
  exportTheme,
  previewUrl,
  isExporting,
  hasPoem,
  onExportRatioChange,
  onExportThemeChange,
  onPreview,
  onDownloadPreview,
}: ExportPanelProps) {
  return (
    <section>
      <div className="border-b border-border/70 px-5 py-4">
        <div className="text-sm font-semibold tracking-tight">Export</div>
        <div className="mt-1 text-xs text-muted-foreground">Preview and download a PNG.</div>
      </div>

      <div className="space-y-3 px-5 py-5">
        <div className="grid grid-cols-2 gap-2">
          <Select value={exportRatio} onValueChange={(value) => onExportRatioChange(value as ExportRatio)}>
            <SelectTrigger className="h-10 rounded-xl border-border/80 bg-background/70 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(exportRatios).map(([key, item]) => (
                <SelectItem key={key} value={key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={exportTheme} onValueChange={(value) => onExportThemeChange(value as ExportTheme)}>
            <SelectTrigger className="h-10 rounded-xl border-border/80 bg-background/70 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(exportThemes).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/80 bg-background/60">
          {previewUrl ? (
            <img src={previewUrl} alt="Poem export preview" className="aspect-[4/5] w-full object-contain" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center px-5 text-center text-sm text-muted-foreground">
              Render a preview before downloading.
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10 rounded-xl text-sm" disabled={!hasPoem || isExporting} onClick={onPreview}>
            {isExporting ? 'Rendering...' : 'Preview'}
          </Button>
          <Button className="h-10 rounded-xl text-sm" disabled={!previewUrl || isExporting} onClick={onDownloadPreview}>
            <Download className="h-4 w-4" />
            PNG
          </Button>
        </div>
      </div>
    </section>
  )
}
