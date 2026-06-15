import { NextResponse } from 'next/server'
import { z } from 'zod'

type PoemLanguage = 'vi' | 'en'
type PoemForm = 'free' | 'haiku' | 'sonnet' | 'luc-bat' | 'that-ngon'
type PoemLength = 'short' | 'medium' | 'long'

type PoemRequest = {
  prompt: string
  imageDataUrl?: string
  language: PoemLanguage
  form: PoemForm
  mood: string
  length: PoemLength
  mustInclude?: string
  avoidWords?: string
  previousPoem?: string
  revisionInstruction?: string
}

type PoemResponse = {
  title: string
  poem: string
  notes?: string
}

const MODEL = 'nex-agi/nex-n2-pro:free'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const REQUEST_TIMEOUT_MS = 45_000

const requestSchema = z.object({
  prompt: z.string().max(4000).default(''),
  imageDataUrl: z
    .string()
    .max(3_500_000)
    .regex(/^data:image\/(png|jpe?g|webp);base64,/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  language: z.enum(['vi', 'en']).default('vi'),
  form: z.enum(['free', 'haiku', 'sonnet', 'luc-bat', 'that-ngon']).default('free'),
  mood: z.string().trim().min(1).max(64).default('Noir'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  mustInclude: z.string().trim().max(180).optional(),
  avoidWords: z.string().trim().max(180).optional(),
  previousPoem: z.string().trim().max(6000).optional(),
  revisionInstruction: z.string().trim().max(240).optional(),
})

const modelOutputSchema = z.object({
  title: z.string().default(''),
  poem: z.string().min(1),
  notes: z.string().optional(),
})

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

function normalizePayload(input: z.infer<typeof requestSchema>): PoemRequest {
  const form =
    input.language === 'vi'
      ? input.form === 'luc-bat' || input.form === 'that-ngon' || input.form === 'free'
        ? input.form
        : 'free'
      : input.form === 'sonnet' || input.form === 'haiku' || input.form === 'free'
        ? input.form
        : 'free'

  return {
    prompt: input.prompt,
    imageDataUrl: input.imageDataUrl || undefined,
    language: input.language,
    form,
    mood: input.mood,
    length: input.length,
    mustInclude: input.mustInclude || undefined,
    avoidWords: input.avoidWords || undefined,
    previousPoem: input.previousPoem || undefined,
    revisionInstruction: input.revisionInstruction || undefined,
  }
}

function lineTarget(length: PoemLength) {
  if (length === 'short') return '8-14 lines'
  if (length === 'medium') return '16-24 lines'
  return '26-40 lines'
}

function formRules(language: PoemLanguage, form: PoemForm) {
  if (form === 'free') {
    return language === 'vi'
      ? [
          'Thơ tự do Việt Nam:',
          '- Không có số chữ cố định, nhưng mỗi dòng phải có nhịp thở rõ: ngắn/dài có chủ ý, không xuống dòng bừa.',
          '- Dùng vần ngầm, điệp âm, nhịp câu nói tự nhiên; tránh ép vần lộ liễu.',
          '- Ưu tiên hình ảnh cụ thể của đời sống Việt: vật, mùi, ánh sáng, âm thanh, cử chỉ; để cảm xúc tự bật ra từ cảnh.',
          '- Có một cú chuyển ý hoặc nén ý ở 1/3 cuối bài; kết thúc mở, không giảng đạo.',
        ].join('\n')
      : [
          'English free verse:',
          '- No fixed meter, but line breaks must create pressure, breath, and turns.',
          '- Use concrete imagery, internal music, consonance/assonance, and sentence rhythm.',
          '- Let emotion arise from scene and action; avoid abstract declarations and diary-like explanation.',
          '- Include a volta or tonal turn near the final third; end on an image or charged statement, not a summary.',
        ].join('\n')
  }

  if (form === 'haiku') {
    return language === 'en'
      ? [
          'English haiku:',
          '- Exactly 3 lines. Prefer 10-17 English syllables total; do not force clumsy 5-7-5 if it damages the poem.',
          '- Present one sharply perceived moment, usually nature/season or a culturally resonant keyword.',
          '- Create a cut: two images or perceptions in tension, joined by silence, punctuation, or line break.',
          '- No title-like explanation, no metaphor lecture, no rhyme, no moral.',
        ].join('\n')
      : [
          'Haiku tiếng Việt theo tinh thần hiện đại:',
          '- Đúng 3 dòng, rất ngắn; không cần máy móc đếm 5-7-5.',
          '- Một khoảnh khắc cụ thể, có mùa/thiên nhiên hoặc một tín hiệu văn hóa đủ gợi.',
          '- Có nhát cắt giữa hai hình ảnh hoặc hai tầng cảm giác; ít lời, nhiều khoảng lặng.',
          '- Không giải thích ý nghĩa.',
        ].join('\n')
  }

  if (form === 'sonnet') {
    return language === 'en'
      ? [
          'Shakespearean / English sonnet:',
          '- Exactly 14 lines: three quatrains and a final couplet.',
          '- Aim for iambic pentameter cadence, but keep diction natural and contemporary.',
          '- Rhyme by end-sound in the spirit of ABAB CDCD EFEF GG, but never print rhyme-scheme letters.',
          '- Develop an argument: quatrain 1 establishes image/problem, quatrain 2 complicates, quatrain 3 turns, couplet seals or overturns.',
          '- The volta should be felt around lines 9-12.',
        ].join('\n')
      : 'Sonnet chỉ hợp tiếng Anh trong app này. Nếu language=vi, hãy chuyển sang thơ tự do Việt Nam.'
  }

  if (form === 'that-ngon') {
    return language === 'vi'
      ? [
          'Thất ngôn tứ tuyệt Việt/Đường luật mô phỏng:',
          '- Đúng 4 câu, mỗi câu 7 tiếng/chữ Việt.',
          '- Câu 1 mở cảnh hoặc thế cảm xúc; câu 2 triển khai; câu 3 chuyển ý; câu 4 kết tinh dư vang.',
          '- Có vần chân tự nhiên ở các câu chẵn, ưu tiên vần bằng; không in nhãn luật/vần.',
          '- Hàm súc, cổ kính vừa đủ; tránh dùng Hán Việt rỗng hoặc ngôn ngữ giả cổ.',
        ].join('\n')
      : 'Thất ngôn chỉ hợp tiếng Việt. Nếu language=en, hãy chuyển sang free verse.'
  }

  return language === 'vi'
    ? [
        'Lục bát Việt Nam:',
        '- Viết theo cặp 6/8: dòng lục khoảng 6 tiếng, dòng bát khoảng 8 tiếng; số dòng phải chẵn.',
        '- Vần nối: tiếng thứ 6 của dòng lục hiệp với tiếng thứ 6 của dòng bát; tiếng thứ 8 của dòng bát mở vần cho dòng lục kế tiếp.',
        '- Thanh điệu nên mềm: các vị trí chẵn giữ cảm giác bằng/trắc tự nhiên, ưu tiên vần bằng ở điểm gieo.',
        '- Có chất ca dao nhưng không cổ lỗ; dùng tiếng Việt đời sống, giàu nhạc, ít diễn giải.',
        '- Nếu phải chọn giữa đúng luật tuyệt đối và thơ hay, ưu tiên nhạc tự nhiên nhưng vẫn giữ 6/8 rõ.',
      ].join('\n')
    : 'Lục bát chỉ hợp tiếng Việt. Nếu language=en, hãy chuyển sang free verse.'
}

function lengthRules(language: PoemLanguage, length: PoemLength, form: PoemForm) {
  if (form === 'haiku') return language === 'en' ? '3 lines.' : '3 dòng.'
  if (form === 'sonnet') return '14 lines.'
  if (form === 'that-ngon') return '4 dòng.'
  return language === 'en' ? lineTarget(length) : lineTarget(length).replace('lines', 'dòng')
}

function buildSystemPrompt(language: PoemLanguage) {
  const universal = [
    'You are NOIR Poet: a serious bilingual poet and ruthless line editor, not a generic AI assistant.',
    'Write the poem first in your private scratchpad, then revise it once before output.',
    'Your revision pass must remove cliches, abstract filler, moralizing, decorative adjectives, and obvious AI phrasing.',
    'Make the poem earn emotion through image, rhythm, syntax, silence, and turn.',
    'Prefer precise nouns and verbs over explanation. Use sensory detail, tension, and fresh but intelligible phrasing.',
    'Never explain the poem inside the poem. Never include analysis, bullets, markdown, or labels in the output.',
    'Never print rhyme scheme labels such as ABAB, CDCD, EF, GG, bằng, trắc, kireji, volta, or syllable counts inside the poem.',
    'Return only valid JSON: { "title": string, "poem": string, "notes": string }.',
  ]

  if (language === 'vi') {
    return [
      ...universal,
      'Vietnamese craft mode:',
      '- Bạn viết tiếng Việt tự nhiên, có nhạc tính, hiểu lục bát, ca dao, thơ Đường luật Việt hóa, Thơ Mới và thơ hiện đại.',
      '- Không viết kiểu văn dịch từ tiếng Anh. Không dùng câu sáo: bóng tối trong tim, linh hồn tan vỡ, giấc mơ vỡ vụn, ánh sáng cuối đường, nếu prompt không đòi hỏi.',
      '- Dùng dấu câu tiết chế để điều khiển hơi thở. Dòng thơ phải có nhịp, không trơn tuột như văn xuôi cắt dòng.',
      '- Tiếng Việt cần giàu âm: phụ âm, nguyên âm, thanh điệu, vần lưng/vần chân khi hợp thể.',
      '- Giữ giọng riêng: lạnh, tinh, có hình ảnh, không sướt mướt, không triết lý trực tiếp.',
    ].join('\n')
  }

  return [
    ...universal,
    'English craft mode:',
    '- Write literary English, not greeting-card verse, therapy prose, song lyrics, or fantasy narration unless requested.',
    '- Use lineation, enjambment, sonic texture, and volta. Avoid purple prose and stock pairings such as shattered heart, endless night, silent screams, fading dreams.',
    '- In formal verse, respect the architecture without sounding mechanical.',
    '- In haiku, prioritize perception, cut, and image over counting syllables.',
  ].join('\n')
}

function buildUserPrompt(body: PoemRequest) {
  const langLabel = body.language === 'vi' ? 'Vietnamese' : 'English'
  const craftBrief =
    body.language === 'vi'
      ? [
          'Craft checklist before final JSON:',
          '- Có ít nhất 3 hình ảnh cụ thể, không chỉ cảm xúc trừu tượng.',
          '- Mỗi dòng có lý do tồn tại: nhịp, hình ảnh, cú chuyển, hoặc dư âm.',
          '- Không kết bằng lời giải thích ý nghĩa bài thơ.',
          '- Nếu là lục bát/thất ngôn, tự kiểm số tiếng từng dòng trước khi trả.',
        ].join('\n')
      : [
          'Craft checklist before final JSON:',
          '- Include concrete images rather than abstract emotion alone.',
          '- Every line must carry pressure: image, turn, music, or consequence.',
          '- Avoid explanatory endings; close with resonance.',
          '- If formal, privately check line count and architecture before returning.',
        ].join('\n')

  const base = [
    `Language: ${langLabel}`,
    `Mood: ${body.mood}`,
    `Form: ${body.form}`,
    `Length target: ${lengthRules(body.language, body.length, body.form)}`,
    '',
    'Form guide:',
    formRules(body.language, body.form),
    '',
    craftBrief,
    '',
    'Hard constraints:',
    '- Do not use quotation marks in the poem.',
    '- Use punctuation for rhythm.',
    '- Return only valid JSON, no markdown.',
  ]

  if (body.mustInclude) base.push(`- Must include verbatim somewhere: ${body.mustInclude}`)
  if (body.avoidWords) base.push(`- Avoid these words or phrases: ${body.avoidWords}`)
  if (body.imageDataUrl) {
    base.push('- A reference image is attached. Read it as visual source material: objects, light, color, weather, composition, mood, gesture, and implied story. Do not describe it mechanically; transform it into poetry.')
  }

  if (body.previousPoem && body.revisionInstruction) {
    base.push('')
    base.push('Revision task:')
    base.push(body.revisionInstruction)
    base.push('Revise as a poet-editor: preserve the strongest image or line if it works, but do not be loyal to weak phrasing.')
    base.push('')
    base.push('Previous poem:')
    base.push(body.previousPoem)
  } else {
    base.push('')
    base.push('Source prompt:')
    base.push(body.prompt.trim() || '(empty)')
  }

  base.push('')
  base.push('JSON output schema:')
  base.push('{ "title": string, "poem": string, "notes": string }')
  base.push('The poem value must contain line breaks using \\n.')
  base.push('The notes value should be one short craft note, not an explanation of meaning.')

  return base.join('\n')
}

function splitTerms(value?: string) {
  return (value ?? '')
    .split(/[,;\n]/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function poemLines(poem: string) {
  return poem
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function countPoemLines(poem: string) {
  return poemLines(poem).length
}

function countVietnameseWords(line: string) {
  return line
    .replace(/[.,;:!?()[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

function qualityIssues(payload: PoemRequest, output: PoemResponse) {
  const issues: string[] = []
  const poem = output.poem.trim()
  const lowerPoem = poem.toLocaleLowerCase(payload.language === 'vi' ? 'vi' : 'en')
  const lines = poemLines(poem)
  const lineCount = lines.length

  for (const term of splitTerms(payload.avoidWords)) {
    if (lowerPoem.includes(term.toLocaleLowerCase(payload.language === 'vi' ? 'vi' : 'en'))) {
      issues.push(`Avoided phrase still appears: ${term}`)
    }
  }

  for (const term of splitTerms(payload.mustInclude)) {
    if (!lowerPoem.includes(term.toLocaleLowerCase(payload.language === 'vi' ? 'vi' : 'en'))) {
      issues.push(`Required phrase is missing: ${term}`)
    }
  }

  if (!/[.,;:!?]/.test(poem)) {
    issues.push('Poem needs visible punctuation for rhythm.')
  }

  if (payload.form === 'haiku' && lineCount !== 3) {
    issues.push(`Haiku must have exactly 3 non-empty lines; current line count is ${lineCount}.`)
  }

  if (payload.form === 'sonnet' && lineCount !== 14) {
    issues.push(`Sonnet must have exactly 14 non-empty lines; current line count is ${lineCount}.`)
  }

  if (payload.form === 'that-ngon') {
    if (lineCount !== 4) {
      issues.push(`Thất ngôn tứ tuyệt must have exactly 4 non-empty lines; current line count is ${lineCount}.`)
    }
    const offLines = lines
      .map((line, index) => ({ index: index + 1, count: countVietnameseWords(line) }))
      .filter((item) => item.count < 6 || item.count > 8)
    if (offLines.length) {
      issues.push(
        `Thất ngôn lines should be close to 7 tiếng: ${offLines
          .map((item) => `line ${item.index} has ${item.count}`)
          .join(', ')}.`,
      )
    }
  }

  if (payload.form === 'luc-bat') {
    if (lineCount % 2 !== 0) {
      issues.push(`Lục bát should have an even number of lines; current line count is ${lineCount}.`)
    }
    const offLines = lines
      .map((line, index) => {
        const target = index % 2 === 0 ? 6 : 8
        return { index: index + 1, target, count: countVietnameseWords(line) }
      })
      .filter((item) => Math.abs(item.count - item.target) > 1)
    if (offLines.length) {
      issues.push(
        `Lục bát should alternate 6/8 tiếng: ${offLines
          .slice(0, 4)
          .map((item) => `line ${item.index} has ${item.count}, target ${item.target}`)
          .join(', ')}.`,
      )
    }
  }

  if (payload.form === 'free') {
    if (payload.length === 'short' && (lineCount < 8 || lineCount > 14)) {
      issues.push(`Short poem should be 8-14 lines; current line count is ${lineCount}.`)
    }
    if (payload.length === 'medium' && (lineCount < 16 || lineCount > 24)) {
      issues.push(`Medium poem should be 16-24 lines; current line count is ${lineCount}.`)
    }
    if (payload.length === 'long' && (lineCount < 26 || lineCount > 40)) {
      issues.push(`Long poem should be 26-40 lines; current line count is ${lineCount}.`)
    }
  }

  return issues.slice(0, 6)
}

async function callOpenRouter(apiKey: string, payload: PoemRequest) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const userPrompt = buildUserPrompt(payload)
    const userContent = payload.imageDataUrl
      ? [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: payload.imageDataUrl } },
        ]
      : userPrompt

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
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
          { role: 'user', content: userContent },
        ],
        temperature: 0.86,
        top_p: 0.9,
        frequency_penalty: 0.35,
        presence_penalty: 0.15,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const message = text || res.statusText || 'Provider request failed'
      throw new Error(`OpenRouter error ${res.status}: ${message}`)
    }

    return res.json() as Promise<{ choices?: Array<{ message?: { content?: unknown } }> }>
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('OpenRouter request timed out. Try a shorter prompt or try again.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsedBody = requestSchema.safeParse(json)
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: 'Invalid poem request',
        issues: parsedBody.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 },
    )
  }

  const payload = normalizePayload(parsedBody.data)

  try {
    const data = await callOpenRouter(apiKey, payload)
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Unexpected model response' }, { status: 500 })
    }

    const parsedOutput = safeJsonParse<PoemResponse>(content)
    const modelOutput = modelOutputSchema.safeParse(parsedOutput)
    if (!modelOutput.success) {
      return NextResponse.json({ title: '', poem: content.trim() }, { status: 200 })
    }

    let output = modelOutput.data
    let warnings = qualityIssues(payload, output)

    if (warnings.length) {
      const repairedPayload: PoemRequest = {
        ...payload,
        previousPoem: output.poem,
        revisionInstruction: [
          'Repair the poem before returning it.',
          'Fix these quality issues exactly:',
          ...warnings.map((issue) => `- ${issue}`),
          'Do not flatten the poem into explanation. Improve the craft while fixing the form.',
          'Keep the title only if it still fits.',
          'Return only valid JSON with title, poem, and notes.',
        ].join('\n'),
      }

      const repairedData = await callOpenRouter(apiKey, repairedPayload)
      const repairedContent = repairedData?.choices?.[0]?.message?.content
      const repairedOutput =
        typeof repairedContent === 'string'
          ? modelOutputSchema.safeParse(safeJsonParse<PoemResponse>(repairedContent))
          : null

      if (repairedOutput?.success) {
        output = repairedOutput.data
        warnings = qualityIssues(payload, output)
      }
    }

    return NextResponse.json(
      {
        title: output.title.trim(),
        poem: output.poem.trim(),
        notes: output.notes?.trim() || undefined,
        qualityWarnings: warnings.length ? warnings : undefined,
      },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
