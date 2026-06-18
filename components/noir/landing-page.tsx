'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { type MouseEvent, useEffect, useRef } from 'react'

import { NoirLogo } from '@/components/noir/noir-logo'
import { ThemeToggle } from '@/components/theme-toggle'

const thresholds = [
  ['prompt', 'a first line, a private memory, a visual spark'],
  ['image', 'color, silence, weather, light on the edge of things'],
  ['form', 'free verse, lục bát, thất ngôn, sonnet, haiku'],
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
  ['Một ảnh cũ không nói hết mùa mưa.', 'An old image keeps the rain unfinished.'],
  ['Tên gọi nằm im trong vùng tối.', 'A name waits inside the dark.'],
  ['Ký ức nghiêng đi, câu thơ tự sáng.', 'Memory tilts, and the line begins to glow.'],
]

const forms = ['free verse', 'lục bát', 'thất ngôn', 'sonnet', 'haiku', 'cinquain']

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const heroImageRef = useRef<HTMLDivElement | null>(null)
  const heroTitleRef = useRef<HTMLHeadingElement | null>(null)
  const heroCopyRef = useRef<HTMLParagraphElement | null>(null)
  const heroRuleRef = useRef<HTMLDivElement | null>(null)
  const heroCtaRef = useRef<HTMLAnchorElement | null>(null)
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
        const heroLetters = heroTitleRef.current
          ? Array.from(heroTitleRef.current.querySelectorAll('[data-hero-letter]'))
          : []

        gsap.set(heroTitleRef.current, { autoAlpha: 1 })
        gsap.set(heroLetters, { yPercent: 112, rotate: 4 })
        gsap.set([heroCopyRef.current, heroCtaRef.current], { autoAlpha: 0, y: 28 })
        gsap.set(heroRuleRef.current, { scaleX: 0, transformOrigin: 'left center' })
        gsap.set(heroImageRef.current, { scale: 1.14 })
        gsap.set([thresholdRefs.current, sequenceRefs.current, verseRefs.current, finalRef.current], {
          autoAlpha: 0,
          y: 54,
        })

        const hero = gsap.timeline({ defaults: { ease: 'power3.out' } })
        hero
          .to(heroImageRef.current, { scale: 1, duration: 3.2, ease: 'power2.out' }, 0)
          .to(heroLetters, { yPercent: 0, rotate: 0, duration: 1.05, stagger: 0.07 }, 0.16)
          .to(heroRuleRef.current, { scaleX: 1, duration: 0.9 }, 0.72)
          .to(heroCopyRef.current, { autoAlpha: 1, y: 0, duration: 0.78 }, 0.82)
          .to(heroCtaRef.current, { autoAlpha: 1, y: 0, duration: 0.72 }, 1.04)

        gsap.to(heroImageRef.current, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: heroImageRef.current,
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
      <section className="relative min-h-svh overflow-hidden">
        <div
          ref={heroImageRef}
          className="absolute -inset-x-px -top-[12vh] -bottom-[12vh] bg-cover bg-center"
          style={{ backgroundImage: "url('/background.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.45)_52%,rgba(255,255,255,0.95)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.48)_52%,rgba(0,0,0,0.96)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.18),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.08),transparent_62%)]" />

        <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-[clamp(18px,4vw,54px)] py-6 text-sm">
          <Link href="/" aria-label="NOIR home" className="inline-flex">
            <NoirLogo size={58} />
          </Link>
          <ThemeToggle />
        </header>

        <div className="relative z-10 flex min-h-svh flex-col justify-end px-[clamp(18px,5vw,76px)] pb-[clamp(36px,8vw,96px)]">
          <h1
            ref={heroTitleRef}
            className="flex max-w-fit select-none overflow-hidden text-[clamp(92px,22vw,340px)] font-black leading-[0.72] tracking-[-0.08em]"
            aria-label="NOIR"
          >
            {['N', 'O', 'I', 'R'].map((letter) => (
              <span key={letter} className="block overflow-hidden pb-[0.06em]">
                <span data-hero-letter className="block">
                  {letter}
                </span>
              </span>
            ))}
          </h1>
          <div ref={heroRuleRef} className="mt-7 h-px w-full max-w-[760px] bg-foreground/34" />
          <p
            ref={heroCopyRef}
            className="mt-7 max-w-[680px] font-serif text-[clamp(30px,4.7vw,78px)] leading-[0.92] tracking-[-0.04em]"
          >
            Poetry from image, memory, and form.
          </p>
          <Link
            ref={heroCtaRef}
            href="/write"
            onMouseMove={moveMagnetic}
            onMouseLeave={resetMagnetic}
            className="mt-8 inline-flex h-12 w-fit items-center gap-3 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Try NOIR
            <ArrowUpRight className="h-4 w-4" />
          </Link>
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
          {versePairs.map(([vi, en], index) => (
            <div
              key={vi}
              ref={(node) => {
                verseRefs.current[index] = node
              }}
              className="grid gap-5 border-t border-border pt-8 md:grid-cols-2 md:gap-12"
            >
              <p className="font-serif text-[clamp(32px,5vw,78px)] leading-[0.96] tracking-[-0.04em]">{vi}</p>
              <p className="font-serif text-[clamp(32px,5vw,78px)] leading-[0.96] tracking-[-0.04em] text-muted-foreground">
                {en}
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
