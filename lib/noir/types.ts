import type { exportRatios, exportThemes, languages, lengths, moods } from './constants'

export type Language = (typeof languages)[number]['value']
export type Length = (typeof lengths)[number]['value']
export type Mood = (typeof moods)[number]
export type ExportRatio = keyof typeof exportRatios
export type ExportTheme = keyof typeof exportThemes

export type PoemResponse = {
  title?: string
  poem?: string
  error?: string
}

export type PoemVersion = {
  id: string
  title: string
  poem: string
  action: string
  createdAt: string
}

export type PoemStudioDraft = {
  prompt: string
  imageDataUrl: string | null
  imageName: string
  language: Language
  form: string
  mood: Mood
  length: Length
  mustInclude: string
  avoidWords: string
  title: string
  poem: string
  versions: PoemVersion[]
  selectedVersionId: string | null
  exportRatio: ExportRatio
  exportTheme: ExportTheme
}
