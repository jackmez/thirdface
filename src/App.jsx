import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import skyVideo from './assets/sky-web.mp4'

const INTRO_PHASE = {
  loading: 'loading',
  revealQuote: 'reveal-quote',
  holdFrame: 'hold-frame',
  revealBrand: 'reveal-brand',
  complete: 'complete',
}

const quoteLines = [
  ['The', 'most', 'powerful', 'relationship'],
  ['is', 'the', 'one', 'you', 'have', 'with', 'yourself.'],
]

const introStartDelay = 0.04
const wordStagger = 0.22
const secondLineDelay = 0.62
const wordRevealDuration = 1.2
const quoteRevealDelay = 0.2
const frameSettleDuration = 3.2
const wordExitStagger = 0.09
const wordExitDuration = 0.86
const brandRevealDuration = 1.45

const frameConfig = {
  mobileBreakpoint: 700,
  desktopRatio: 0.7,
  mobileRatio: 0.88,
  desktopMax: 44 * 16,
  mobileMax: 34 * 16,
}

const defaultViewport = { width: 1440, height: 900, frameSize: 630 }
const quoteRevealTotal =
  secondLineDelay + ((quoteLines[1].length - 1) * wordStagger) + wordRevealDuration + quoteRevealDelay
const quoteExitTotal =
  ((quoteLines.flat().length - 1) * wordExitStagger) + wordExitDuration + 0.28

let wordsBeforeLine = 0
const quoteWordGroups = quoteLines.map((line, lineIndex) => {
  const entryOffset = lineIndex === 0 ? 0 : secondLineDelay
  const exitOffset = wordsBeforeLine

  wordsBeforeLine += line.length

  return line.map((word, wordIndex) => ({
    key: `line-${lineIndex}-${wordIndex}-${word}`,
    word,
    entryDelay: entryOffset + (wordIndex * wordStagger),
    exitDelay: (exitOffset + wordIndex) * wordExitStagger,
  }))
})

const easing = {
  videoFade: [0.2, 0.8, 0.2, 1],
  quoteReveal: [0.16, 0.84, 0.22, 1],
  quoteExit: [0.72, 0, 0.94, 1],
  frameSettle: [0.22, 0.02, 0.08, 1],
  brandReveal: [0.18, 0.84, 0.2, 1],
}

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: 'blur(6px)',
  },
  visible: ({ entryDelay, prefersReducedMotion }) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: prefersReducedMotion ? 0 : entryDelay,
      duration: prefersReducedMotion ? 0 : wordRevealDuration,
      ease: easing.quoteReveal,
    },
  }),
  exit: ({ exitDelay, prefersReducedMotion }) => ({
    opacity: 0,
    y: 18,
    filter: 'blur(4px)',
    transition: {
      delay: prefersReducedMotion ? 0 : exitDelay,
      duration: prefersReducedMotion ? 0 : wordExitDuration,
      ease: easing.quoteExit,
    },
  }),
}

function getViewportState() {
  if (typeof window === 'undefined') {
    return defaultViewport
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const isMobile = width <= frameConfig.mobileBreakpoint
  const frameRatio = isMobile ? frameConfig.mobileRatio : frameConfig.desktopRatio
  const frameMax = isMobile ? frameConfig.mobileMax : frameConfig.desktopMax
  const frameSize = Math.min(frameRatio * Math.min(width, height), frameMax)

  return { width, height, frameSize }
}

function getPrefersReducedMotion() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const videoRef = useRef(null)
  const [viewport, setViewport] = useState(getViewportState)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion)
  const [isMediaReady, setIsMediaReady] = useState(false)
  const [phase, setPhase] = useState(INTRO_PHASE.loading)

  const hasIntroStarted = phase !== INTRO_PHASE.loading
  const isSettled =
    phase === INTRO_PHASE.holdFrame ||
    phase === INTRO_PHASE.revealBrand ||
    phase === INTRO_PHASE.complete
  const isQuoteExiting = phase === INTRO_PHASE.revealBrand || phase === INTRO_PHASE.complete
  const isBrandVisible = phase === INTRO_PHASE.complete

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportState())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function handleChange(event) {
      setPrefersReducedMotion(event.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return undefined
    }

    let isMounted = true

    const attemptPlayback = async () => {
      try {
        await video.play()
      } catch {
        // If autoplay is blocked, the intro can still continue once media has loaded.
      } finally {
        if (isMounted && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          setIsMediaReady(true)
        }
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsMediaReady(true)
    }

    attemptPlayback()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!prefersReducedMotion || phase === INTRO_PHASE.complete) {
      return
    }

    setPhase(INTRO_PHASE.complete)
  }, [phase, prefersReducedMotion])

  useEffect(() => {
    if (phase !== INTRO_PHASE.loading || !isMediaReady) {
      return undefined
    }

    if (prefersReducedMotion) {
      setPhase(INTRO_PHASE.complete)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setPhase(INTRO_PHASE.revealQuote)
    }, introStartDelay * 1000)

    return () => window.clearTimeout(timer)
  }, [isMediaReady, phase, prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined
    }

    let nextPhase
    let delay = 0

    if (phase === INTRO_PHASE.revealQuote) {
      nextPhase = INTRO_PHASE.holdFrame
      delay = quoteRevealTotal
    } else if (phase === INTRO_PHASE.holdFrame) {
      nextPhase = INTRO_PHASE.revealBrand
      delay = frameSettleDuration
    } else if (phase === INTRO_PHASE.revealBrand) {
      nextPhase = INTRO_PHASE.complete
      delay = quoteExitTotal
    } else {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setPhase(nextPhase)
    }, delay * 1000)

    return () => window.clearTimeout(timer)
  }, [phase, prefersReducedMotion])

  return (
    <main className="app-shell" aria-labelledby="site-title">
      <h1 id="site-title" className="sr-only">
        thirdface
      </h1>

      <div className="video-frame-shell">
        <motion.div
          className="video-frame"
          initial={false}
          animate={{
            width: isSettled ? viewport.frameSize : viewport.width,
            height: isSettled ? viewport.frameSize : viewport.height,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : frameSettleDuration,
            ease: easing.frameSettle,
          }}
        >
          <motion.video
            ref={videoRef}
            className="background-video"
            src={skyVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            initial={false}
            animate={{ opacity: hasIntroStarted ? 1 : 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : wordRevealDuration,
              ease: easing.videoFade,
            }}
            onLoadedData={() => setIsMediaReady(true)}
            onError={() => setIsMediaReady(true)}
            aria-hidden="true"
          />

          <motion.div
            className="quote-wrap"
            initial={false}
            animate={{ opacity: hasIntroStarted ? 1 : 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              delay: prefersReducedMotion ? 0 : 0.18,
              ease: 'easeOut',
            }}
            aria-hidden="true"
          >
            <p className="quote-text">
              {quoteWordGroups.map((line, lineIndex) => (
                <span key={`quote-line-${lineIndex}`} className="quote-line">
                  {line.map(({ key, word, entryDelay, exitDelay }) => (
                    <motion.span
                      key={key}
                      className="quote-word"
                      custom={{ entryDelay, exitDelay, prefersReducedMotion }}
                      initial="hidden"
                      animate={isQuoteExiting ? 'exit' : hasIntroStarted ? 'visible' : 'hidden'}
                      variants={wordVariants}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              ))}
            </p>

            <motion.p
              className="brand-text"
              initial={false}
              animate={{
                opacity: isBrandVisible ? 1 : 0,
                y: isBrandVisible ? 0 : 9,
                filter: isBrandVisible ? 'blur(0px)' : 'blur(4px)',
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : brandRevealDuration,
                ease: easing.brandReveal,
              }}
            >
              thirdface
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
