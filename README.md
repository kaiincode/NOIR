<p align="center">
  <img src="public/logo-dark.png" alt="NOIR" width="120" height="120" />
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=flat&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-111827?style=flat&logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-0b1b2b?style=flat&logo=typescript&logoColor=3178C6" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-0b1b2b?style=flat&logo=tailwindcss&logoColor=38BDF8" />
  <img alt="OpenRouter" src="https://img.shields.io/badge/OpenRouter-API-111827?style=flat&logoColor=white" />
</p>

## NOIR

**A bilingual poem studio** for English and Vietnamese.

NOIR treats poetry like an instrument: you bring a spark, it gives you form, rhythm, and a way back in.

Write from a prompt. Choose a literary form. Tune the mood. Revise without losing the voice.

Export a clean, themed PNG for sharing.

## Features

Language and form:

- Vietnamese: free verse, lục bát, thất ngôn tứ tuyệt
- English: free verse, Shakespearean sonnet, haiku

Controls and workflow:

- mood, length, must-include, avoid
- revisions: darker, softer, shorter, more imagery, re-voice
- export: copy text or save as a themed PNG (auto two-column layout for long poems)

## Tech

- Next.js (App Router)
- `next-themes` for light/dark
- OpenRouter: `openai/gpt-oss-20b:free`

## Local development

```bash
npm install
npm run dev
```

Create `.env`:

```bash
OPENROUTER_API_KEY=...
APP_URL=http://localhost:3000
```

Open `http://localhost:3000`.

## API

- `POST /api/poem`
  - Generate or revise a poem from controls and optional revision instructions.

## Notes

- Do not commit `.env`. This repository ignores it via `.gitignore`.

