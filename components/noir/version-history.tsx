'use client'

import { History } from 'lucide-react'

import type { Language, PoemVersion } from '@/lib/noir/types'

type VersionHistoryProps = {
  language: Language
  versions: PoemVersion[]
  selectedVersionId: string | null
  onSelect: (version: PoemVersion) => void
}

export function VersionHistory({ language, versions, selectedVersionId, onSelect }: VersionHistoryProps) {
  return (
    <section className="border-b border-border/80">
      <div className="flex items-center gap-2 px-5 py-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="text-sm font-semibold tracking-tight">Versions</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Last 12 drafts.</div>
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto border-t border-border/70">
        {versions.length ? (
          versions.map((version, index) => (
            <button
              key={version.id}
              type="button"
              className={`group grid w-full grid-cols-[3px_1fr] text-left transition hover:bg-background/70 ${
                selectedVersionId === version.id ? 'bg-background text-foreground' : 'text-foreground/86'
              }`}
              onClick={() => onSelect(version)}
            >
              <span className={selectedVersionId === version.id ? 'bg-foreground' : 'bg-transparent'} />
              <span className="border-b border-border/60 px-3 py-3">
                <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span>{version.action}</span>
                  <span className="text-muted-foreground">v{versions.length - index}</span>
                </span>
                <span className="mt-1 block truncate text-sm font-medium">
                  {version.title || (language === 'vi' ? 'Không tiêu đề' : 'Untitled')}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{version.createdAt}</span>
              </span>
            </button>
          ))
        ) : (
          <div className="px-5 py-5 text-sm text-muted-foreground">
            {language === 'vi'
              ? 'Mỗi lần viết hoặc revise sẽ được lưu ở đây.'
              : 'Every draft or revision will appear here.'}
          </div>
        )}
      </div>
    </section>
  )
}
