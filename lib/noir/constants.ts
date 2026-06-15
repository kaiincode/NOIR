export const languages = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' },
] as const

export const viForms = [
  { value: 'free', label: 'Thơ tự do' },
  { value: 'luc-bat', label: 'Lục bát' },
  { value: 'that-ngon', label: 'Thất ngôn tứ tuyệt' },
] as const

export const enForms = [
  { value: 'free', label: 'Free verse' },
  { value: 'sonnet', label: 'Sonnet (Shakespearean)' },
  { value: 'haiku', label: 'Haiku' },
] as const

export const moods = ['Noir', 'Tender', 'Cinematic', 'Melancholy', 'Hopeful', 'Ironic', 'Minimal'] as const

export const lengths = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
] as const

export const exportRatios = {
  portrait: { label: 'Portrait', width: 1080, height: 1350 },
  story: { label: 'Story', width: 1080, height: 1920 },
  square: { label: 'Square', width: 1080, height: 1080 },
} as const

export const exportThemes = {
  auto: 'Auto',
  dark: 'Noir black',
  light: 'Paper white',
} as const

export const NOIR_STORAGE_KEY = 'noir-poem-studio:v2'

export function getRevisionButtons(language: 'vi' | 'en') {
  return [
    {
      key: 'darker',
      label: language === 'vi' ? 'Tối hơn' : 'Darker',
      instruction:
        language === 'vi'
          ? 'Làm tối hơn, noir hơn. Cắt chữ thừa. Tăng đối lập hình ảnh.'
          : 'Make it darker and more noir. Cut filler. Increase image contrast.',
    },
    {
      key: 'softer',
      label: language === 'vi' ? 'Dịu hơn' : 'Softer',
      instruction:
        language === 'vi'
          ? 'Dịu hơn, ấm hơn. Giữ tinh tế, tránh sến.'
          : 'Softer and warmer. Keep restraint; avoid sentimentality.',
    },
    {
      key: 'shorter',
      label: language === 'vi' ? 'Ít chữ hơn' : 'Shorter',
      instruction:
        language === 'vi'
          ? 'Rút gọn còn khoảng 60%. Giữ những dòng mạnh nhất.'
          : 'Compress to about 60%. Keep only the strongest lines.',
    },
    {
      key: 'more-imagery',
      label: language === 'vi' ? 'Thêm hình ảnh' : 'More imagery',
      instruction:
        language === 'vi'
          ? 'Tăng hình ảnh cụ thể về ánh sáng, chất liệu, mùi, âm. Giữ nhịp.'
          : 'Add concrete sensory imagery: light, texture, smell, sound. Keep rhythm.',
    },
  ] as const
}
