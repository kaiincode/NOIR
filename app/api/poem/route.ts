import { NextResponse } from 'next/server'

type PoemLanguage = 'vi' | 'en'
type PoemForm = 'free' | 'haiku' | 'sonnet' | 'luc-bat' | 'that-ngon'
type PoemLength = 'short' | 'medium' | 'long'

type PoemRequest = {
  prompt: string
  language: PoemLanguage
  form: PoemForm
  mood: string
  length: PoemLength
  mustInclude?: string
  avoidWords?: string
  // For revision flow
  previousPoem?: string
  revisionInstruction?: string
}

type PoemResponse = {
  title: string
  poem: string
  notes?: string
}

const MODEL = 'openai/gpt-oss-20b:free'

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as T
    } catch {
      return null
    }
  }
}

function formRules(language: PoemLanguage, form: PoemForm) {
  if (form === 'free') {
    return language === 'vi'
      ? 'Thơ tự do: nhịp mượt, giàu hình ảnh, có vần ngầm (điệp âm/điệp vần nhẹ), ngắt dòng có chủ ý.'
      : 'Free verse: musical cadence, strong imagery, light internal rhyme/alliteration, intentional line breaks.'
  }
  if (form === 'haiku') {
    return language === 'en'
      ? 'Haiku (literary): 3 lines, 5–7–5 syllables. A sharp turn. Concrete image. Do NOT mention syllable counts.'
      : 'Haiku (dịch thể): 3 dòng, thật ngắn, hình ảnh sắc, có chuyển ý. KHÔNG nhắc số âm tiết.'
  }
  if (form === 'sonnet') {
    return language === 'en'
      ? 'English sonnet (literary): exactly 14 lines. Shakespearean rhyme ABAB CDCD EFEF GG (rhyme by end-words; DO NOT print scheme letters). Natural modern diction. Volta around lines 9–12.'
      : 'Sonnet chỉ hợp tiếng Anh — nếu language=vi thì không dùng form này.'
  }
  if (form === 'that-ngon') {
    return language === 'vi'
      ? 'Thất ngôn tứ tuyệt (văn học): 4 câu, mỗi câu ~7 chữ, nhịp chắc, có vần (vần chân), ý tứ hàm súc.'
      : 'Thất ngôn chỉ hợp tiếng Việt — nếu language=en thì không dùng form này.'
  }
  // luc-bat
  return language === 'vi'
    ? 'Lục bát (văn học): đúng nhịp 6/8, gieo vần tự nhiên (không gượng), ngôn ngữ hiện đại, hình ảnh mạnh.'
    : 'Lục bát chỉ hợp tiếng Việt — nếu language=en thì không dùng form này.'
}

function lengthRules(language: PoemLanguage, length: PoemLength) {
  if (length === 'short') return language === 'en' ? '8–14 lines.' : '8–14 dòng.'
  if (length === 'medium') return language === 'en' ? '16–24 lines.' : '16–24 dòng.'
  return language === 'en' ? '26–40 lines.' : '26–40 dòng.'
}

function buildSystemPrompt(language: PoemLanguage) {
  if (language === 'vi') {
    return [
      'Bạn là NOIR Poet.',
      'Bạn viết thơ tiếng Việt hay, đúng thể thơ khi được yêu cầu, nhạc tính rõ, vần tự nhiên.',
      'Tránh văn AI: không sáo rỗng, không giải thích đạo lý, không kể lể chung chung.',
      'Không dùng dấu ngoặc kép (", “ ”). Không viết tiêu đề dạng “Bài thơ về…”.',
      'Bắt buộc có dấu câu (., , ; :) dùng tinh tế để câu thơ có nhịp thở. Không viết trơn tuột không dấu.',
      'Tuyệt đối KHÔNG được in ký hiệu vần như ABAB, CDCD, "AB", "CD" ở cuối dòng hay trong bài.',
      'Trả về JSON hợp lệ duy nhất, không markdown, không thêm chữ ngoài JSON.',
    ].join('\n')
  }
  return [
    'You are NOIR Poet.',
    'Write English poetry that respects literary forms when requested, with rhyme and musical cadence.',
    'Avoid generic AI verse, clichés, and moralizing.',
    'Use punctuation (periods, commas, semicolons) to control breath and rhythm. Do not output unpunctuated text.',
    'Never print rhyme scheme labels (e.g. ABAB, CDCD, "AB", "CD") anywhere in the poem.',
    'Do not use quotation marks (", “ ”) in the poem.',
    'Return ONLY valid JSON (no markdown, no extra text).',
  ].join('\n')
}

function buildUserPrompt(body: PoemRequest) {
  const langLabel = body.language === 'vi' ? 'Vietnamese' : 'English'
  const punctuationRule =
    body.language === 'vi'
      ? 'Punctuation: dùng dấu câu thật (., , ; :) để nhịp mượt; phần lớn dòng nên kết thúc bằng dấu câu; bắt buộc có dấu chấm "." trong bài.'
      : 'Punctuation: use real punctuation (., , ; :) for rhythm; most lines should end with punctuation; must include at least one period ".".'
  const noSchemeRule =
    body.language === 'vi'
      ? 'No scheme labels: tuyệt đối không được in AB/CD/EF/GG hay bất kỳ ký hiệu vần nào.'
      : 'No scheme labels: never print AB/CD/EF/GG or any rhyme scheme letters.'
  const noQuotesRule =
    body.language === 'vi'
      ? 'No quotes: không dùng dấu ngoặc kép (", “ ”).'
      : 'No quotes: do not use quotation marks (", “ ”).'
  const base = [
    `Language: ${langLabel}`,
    `Mood: ${body.mood}`,
    `Form: ${body.form}`,
    `Length: ${body.length}`,
    `Rules: ${formRules(body.language, body.form)} ${lengthRules(body.language, body.length)}`,
    punctuationRule,
    noSchemeRule,
    noQuotesRule,
  ]

  if (body.mustInclude?.trim()) base.push(`Must include (verbatim somewhere): ${body.mustInclude.trim()}`)
  if (body.avoidWords?.trim()) base.push(`Avoid words/phrases: ${body.avoidWords.trim()}`)

  if (body.previousPoem?.trim() && body.revisionInstruction?.trim()) {
    base.push('')
    base.push(`Revision instruction: ${body.revisionInstruction.trim()}`)
    base.push('Rewrite the poem accordingly, keeping the best lines, improving rhythm and imagery.')
    base.push('')
    base.push('Previous poem:')
    base.push(body.previousPoem.trim())
  } else {
    base.push('')
    base.push('Prompt:')
    base.push(body.prompt?.trim() || '(empty)')
  }

  base.push('')
  base.push('Output JSON schema:')
  base.push('{ "title": string, "poem": string, "notes": string }')
  base.push('The "poem" value must contain line breaks (\\n).')

  return base.join('\n')
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

  let body: PoemRequest
  try {
    body = (await req.json()) as PoemRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = String(body.prompt ?? '').slice(0, 4000)
  const language: PoemLanguage = body.language === 'en' ? 'en' : 'vi'
  const rawForm = body.form
  const form: PoemForm =
    language === 'vi'
      ? rawForm === 'luc-bat' || rawForm === 'that-ngon' || rawForm === 'free'
        ? rawForm
        : 'free'
      : rawForm === 'sonnet' || rawForm === 'haiku' || rawForm === 'free'
        ? rawForm
        : 'free'
  const length: PoemLength = body.length === 'short' || body.length === 'long' ? body.length : 'medium'

  const payload: PoemRequest = {
    prompt,
    language,
    form,
    mood: String(body.mood ?? 'Cinematic').slice(0, 64),
    length,
    mustInclude: body.mustInclude ? String(body.mustInclude).slice(0, 180) : undefined,
    avoidWords: body.avoidWords ? String(body.avoidWords).slice(0, 180) : undefined,
    previousPoem: body.previousPoem ? String(body.previousPoem).slice(0, 6000) : undefined,
    revisionInstruction: body.revisionInstruction ? String(body.revisionInstruction).slice(0, 240) : undefined,
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
      'X-Title': 'NOIR',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(payload.language) },
        { role: 'user', content: buildUserPrompt(payload) },
      ],
      temperature: 0.75,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({ error: `OpenRouter error ${res.status}: ${text || res.statusText}` }, { status: 500 })
  }

  const data = (await res.json()) as any
  const content: unknown = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'Unexpected model response' }, { status: 500 })
  }

  const parsed = safeJsonParse<PoemResponse>(content)
  if (!parsed?.poem) {
    // fallback: treat the whole content as poem
    return NextResponse.json({ title: '', poem: content.trim() }, { status: 200 })
  }

  return NextResponse.json(
    {
      title: String(parsed.title ?? ''),
      poem: String(parsed.poem ?? '').trim(),
      notes: parsed.notes ? String(parsed.notes) : undefined,
    },
    { status: 200 },
  )
}

