'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { type MouseEvent, useEffect, useRef } from 'react'

import { ThemeToggle } from '@/components/theme-toggle'

const thresholds = [
  ['prompt', 'a first line, a private memory, a visual spark'],
  ['image', 'color, silence, weather, light on the edge of things'],
  ['form', 'free verse, luc bat, that ngon, sonnet, haiku'],
]

const sequence = [
  {
    index: '01',
    title: 'source',
    body: 'Bring a prompt or an image. NOIR listens for the pressure underneath it.',
  },
  {
    index: '02',
    title: 'draft',
    body: 'The poem arrives with structure, mood, and bilingual sensitivity intact.',
  },
  {
    index: '03',
    title: 'export',
    body: 'Revise, copy, preview, and keep the version that still has a pulse.',
  },
]

const versePairs = [
  ['An old photograph keeps the weather unfinished.', 'A line waits where the light thins out.'],
  ['Memory enters as pressure, not decoration.', 'The draft moves until the image breathes.'],
  ['Form is the room the poem agrees to inhabit.', 'Revision turns noise into artifact.'],
]

const forms = ['free verse', 'luc bat', 'that ngon', 'sonnet', 'haiku', 'cinquain']

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const heroWordRef = useRef<HTMLHeadingElement | null>(null)
  const heroFillRef = useRef<HTMLSpanElement | null>(null)
  const heroMetaRef = useRef<HTMLDivElement | null>(null)
  const marqueeRef = useRef<HTMLDivElement | null>(null)
  const thresholdRefs = useRef<Array<HTMLDivElement | null>>([])
  const sequenceRefs = useRef<Array<HTMLElement | null>>([])
  const imagePanelRef = useRef<HTMLDivElement | null>(null)
  const verseRefs = useRef<Array<HTMLDivElement | null>>([])
  const formsTrackRef = useRef<HTMLDivElement | null>(null)
  const finalRef = useRef<HTMLElement | null>(null)
  const gsapRef = useRef<Awaited<typeof import('gsap')>['gsap'] | null>(null)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let alive = true

    const setup = async () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) return

      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (!alive) return

      gsapRef.current = gsap
      gsap.registerPlugin(ScrollTrigger)

      const context = gsap.context(() => {
        gsap.set(heroMetaRef.current, { autoAlpha: 0, y: -18 })
        gsap.set(heroWordRef.current, {
          autoAlpha: 0,
          y: 34,
          scale: 0.96,
        })
        gsap.set(heroFillRef.current, {
          clipPath: 'inset(0 100% 0 0)',
          backgroundPosition: '34% 50%',
        })
        gsap.set([thresholdRefs.current, sequenceRefs.current, verseRefs.current, finalRef.current], {
          autoAlpha: 0,
          y: 54,
        })

        const hero = gsap.timeline({ defaults: { ease: 'expo.out' } })
        hero
          .to(heroMetaRef.current, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.05)
          .to(heroWordRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 1.15 }, 0.16)
          .to(heroFillRef.current, { clipPath: 'inset(0 0% 0 0)', duration: 1.25, ease: 'power4.inOut' }, 0.42)
          .to(heroFillRef.current, { backgroundPosition: '74% 50%', duration: 5.4, ease: 'sine.inOut' }, 0.9)

        gsap.to(heroWordRef.current, {
          yPercent: -10,
          scale: 0.92,
          ease: 'none',
          scrollTrigger: {
            trigger: heroWordRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })

        gsap.to(marqueeRef.current, {
          xPercent: -38,
          ease: 'none',
          scrollTrigger: {
            trigger: marqueeRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.7,
          },
        })

        thresholdRefs.current.forEach((item, index) => {
          if (!item) return
          gsap.to(item, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay: index * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 82%',
            },
          })
        })

        sequenceRefs.current.forEach((item, index) => {
          if (!item) return
          gsap.to(item, {
            autoAlpha: 1,
            y: 0,
            duration: 0.95,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 72%',
              end: 'bottom 46%',
              scrub: 0.8,
            },
          })
          gsap.fromTo(
            item.querySelector('[data-sequence-title]'),
            { xPercent: index % 2 === 0 ? -8 : 8 },
            {
              xPercent: index % 2 === 0 ? 6 : -6,
              ease: 'none',
              scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          )
        })

        gsap.fromTo(
          imagePanelRef.current,
          { clipPath: 'inset(14% 18% 14% 18%)', scale: 1.08 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: imagePanelRef.current,
              start: 'top 74%',
              end: 'bottom 52%',
              scrub: 0.7,
            },
          },
        )

        verseRefs.current.forEach((item, index) => {
          if (!item) return
          gsap.to(item, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: `top ${78 - index * 6}%`,
            },
          })
        })

        gsap.to(formsTrackRef.current, {
          xPercent: -34,
          ease: 'none',
          scrollTrigger: {
            trigger: formsTrackRef.current,
            start: 'top 82%',
            end: 'bottom top',
            scrub: true,
          },
        })

        gsap.to(finalRef.current, {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: finalRef.current,
            start: 'top 78%',
          },
        })
      }, rootRef)

      cleanup = () => context.revert()
    }

    setup()

    return () => {
      alive = false
      cleanup?.()
    }
  }, [])

  const moveMagnetic = (event: MouseEvent<HTMLAnchorElement>) => {
    const gsap = gsapRef.current
    const target = event.currentTarget
    if (!gsap) return

    const rect = target.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) * 0.12
    const y = (event.clientY - rect.top - rect.height / 2) * 0.18
    gsap.to(target, { x, y, duration: 0.35, ease: 'power3.out' })
  }

  const resetMagnetic = (event: MouseEvent<HTMLAnchorElement>) => {
    const gsap = gsapRef.current
    if (!gsap) return
    gsap.to(event.currentTarget, { x: 0, y: 0, duration: 0.45, ease: 'elastic.out(1, 0.45)' })
  }

  return (
    <main ref={rootRef} className="overflow-hidden bg-background text-foreground">
      <section className="relative min-h-svh overflow-hidden bg-background text-foreground">
        <header
          ref={heroMetaRef}
          className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-[clamp(18px,4vw,54px)] py-6 text-sm"
        >
          <Link href="/" aria-label="NOIR home" className="font-black tracking-[-0.04em]">
            NOIR
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/write"
              className="hidden items-center gap-2 text-sm font-semibold tracking-[-0.03em] transition hover:opacity-60 sm:inline-flex"
            >
              Write
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="relative z-20 flex min-h-svh items-center justify-center overflow-hidden px-[clamp(18px,5vw,76px)] pt-12">
          <h1
            ref={heroWordRef}
            className="select-none text-center text-[clamp(92px,25vw,390px)] font-black uppercase leading-none tracking-[0.025em]"
            aria-label="NOIR"
          >
            <span
              ref={heroFillRef}
              aria-hidden="true"
              className="block px-[0.055em] bg-cover bg-center bg-clip-text text-transparent will-change-transform"
              style={{ backgroundImage: "url('/background.png')" }}
            >
              NOIR
            </span>
          </h1>
        </div>
      </section>

      <section className="border-y border-border py-[clamp(54px,9vw,112px)]">
        <div
          ref={marqueeRef}
          className="flex w-[210vw] items-center gap-[clamp(36px,6vw,92px)] whitespace-nowrap px-[clamp(18px,5vw,76px)]"
        >
          {['image', 'memory', 'form', 'silence', 'revision', 'export', 'image', 'memory'].map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="font-serif text-[clamp(62px,13vw,220px)] leading-none tracking-[-0.07em] odd:italic even:font-black"
            >
              {word}
            </span>
          ))}
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,76px)] py-[clamp(80px,14vw,180px)]">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.4fr]">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Input matter</div>
          <div className="space-y-10">
            {thresholds.map(([label, body], index) => (
              <div
                key={label}
                ref={(node) => {
                  thresholdRefs.current[index] = node
                }}
                className="grid gap-5 border-t border-border pt-6 md:grid-cols-[160px_1fr]"
              >
                <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
                <p className="font-serif text-[clamp(34px,5.6vw,92px)] leading-[0.92] tracking-[-0.05em]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        {sequence.map((item, index) => (
          <article
            key={item.title}
            ref={(node) => {
              sequenceRefs.current[index] = node
            }}
            className="min-h-[82svh] border-b border-background/15 px-[clamp(18px,5vw,76px)] py-[clamp(70px,11vw,150px)]"
          >
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="text-xs uppercase tracking-[0.26em] text-background/52">{item.index}</div>
              <div>
                <h2
                  data-sequence-title
                  className="text-[clamp(74px,18vw,280px)] font-black uppercase leading-[0.72] tracking-[-0.08em]"
                >
                  {item.title}
                </h2>
                <p className="mt-8 max-w-[520px] text-base leading-relaxed text-background/68">{item.body}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="px-[clamp(18px,5vw,76px)] py-[clamp(80px,14vw,180px)]">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div
            ref={imagePanelRef}
            className="min-h-[62svh] bg-cover bg-center"
            style={{ backgroundImage: "url('/background.png')" }}
          />
          <div className="border-y border-border py-8">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Image as weather</div>
            <p className="mt-8 font-serif text-[clamp(36px,5.8vw,96px)] leading-[0.9] tracking-[-0.05em]">
              The image does not describe the poem. It changes the air around it.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border px-[clamp(18px,5vw,76px)] py-[clamp(80px,14vw,180px)]">
        <div className="mb-12 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Bilingual room</div>
        <div className="space-y-12">
          {versePairs.map(([left, right], index) => (
            <div
              key={left}
              ref={(node) => {
                verseRefs.current[index] = node
              }}
              className="grid gap-5 border-t border-border pt-8 md:grid-cols-2 md:gap-12"
            >
              <p className="font-serif text-[clamp(32px,5vw,78px)] leading-[0.96] tracking-[-0.04em]">{left}</p>
              <p className="font-serif text-[clamp(32px,5vw,78px)] leading-[0.96] tracking-[-0.04em] text-muted-foreground">
                {right}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-[clamp(80px,14vw,180px)]">
        <div className="px-[clamp(18px,5vw,76px)]">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Form pressure</div>
        </div>
        <div
          ref={formsTrackRef}
          className="mt-12 flex w-[180vw] items-center gap-[clamp(18px,4vw,64px)] whitespace-nowrap px-[clamp(18px,5vw,76px)]"
        >
          {forms.map((form) => (
            <span
              key={form}
              className="border-y border-border py-6 font-serif text-[clamp(58px,11vw,190px)] leading-none tracking-[-0.07em] odd:italic"
            >
              {form}
            </span>
          ))}
        </div>
      </section>

      <section
        ref={finalRef}
        className="min-h-[78svh] border-t border-border px-[clamp(18px,5vw,76px)] py-[clamp(70px,12vw,150px)]"
      >
        <div className="flex min-h-[52svh] flex-col justify-between gap-10">
          <p className="max-w-[980px] font-serif text-[clamp(52px,9vw,156px)] leading-[0.85] tracking-[-0.06em]">
            Write the poem before the image becomes ordinary.
          </p>
          <Link
            href="/write"
            onMouseMove={moveMagnetic}
            onMouseLeave={resetMagnetic}
            className="inline-flex h-12 w-fit items-center gap-3 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Try NOIR
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
