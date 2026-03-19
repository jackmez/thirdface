import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
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

const brandMarkPaths = {
  top: 'M54.2278 0.0192871C55.348 0.0192871 55.908 0.0192871 56.3358 0.237274C56.7121 0.429021 57.0181 0.734982 57.2099 1.11131C57.4278 1.53913 57.4278 2.09918 57.4278 3.21929V5.59409C57.4278 6.7142 57.4278 7.27425 57.2099 7.70207C57.0181 8.0784 56.7121 8.38436 56.3358 8.57611C55.908 8.79409 55.3479 8.79409 54.2278 8.79409H3.5916C2.4715 8.79409 1.91144 8.79409 1.48362 8.57611C1.1073 8.38436 0.801335 8.0784 0.609589 7.70207C0.391602 7.27425 0.391602 6.7142 0.391602 5.59409V3.21929C0.391602 2.09918 0.391602 1.53913 0.609589 1.11131C0.801335 0.734982 1.1073 0.429021 1.48362 0.237274C1.91144 0.0192871 2.4715 0.0192871 3.5916 0.0192871H54.2278Z',
  middle:
    'M45.4531 28.7638C46.5732 28.7638 47.1333 28.7638 47.5611 28.9818C47.9374 29.1735 48.2434 29.4795 48.4351 29.8558C48.6531 30.2836 48.6531 30.8437 48.6531 31.9638V34.3386C48.6531 35.4587 48.6531 36.0188 48.4351 36.4466C48.2434 36.8229 47.9374 37.1289 47.5611 37.3206C47.1333 37.5386 46.5732 37.5386 45.4531 37.5386H12.3665C11.2464 37.5386 10.6863 37.5386 10.2585 37.3206C9.8822 37.1289 9.57624 36.8229 9.38449 36.4466C9.1665 36.0188 9.1665 35.4587 9.1665 34.3386V31.9638C9.1665 30.8437 9.1665 30.2836 9.38449 29.8558C9.57624 29.4795 9.8822 29.1735 10.2585 28.9818C10.6863 28.7638 11.2464 28.7638 12.3665 28.7638H45.4531Z',
  bottom:
    'M54.2278 57.5085C55.3479 57.5085 55.908 57.5085 56.3358 57.7265C56.7121 57.9183 57.0181 58.2242 57.2099 58.6006C57.4278 59.0284 57.4278 59.5884 57.4278 60.7085L57.4278 63.0834C57.4278 64.2035 57.4278 64.7635 57.2099 65.1913C57.0181 65.5677 56.7121 65.8736 56.3358 66.0654C55.908 66.2834 55.3479 66.2834 54.2278 66.2834L3.5916 66.2834C2.47149 66.2834 1.91144 66.2834 1.48362 66.0654C1.10729 65.8736 0.801333 65.5677 0.609587 65.1913C0.3916 64.7635 0.3916 64.2035 0.3916 63.0834L0.391601 60.7085C0.391601 59.5884 0.391601 59.0284 0.609588 58.6006C0.801335 58.2242 1.1073 57.9183 1.48362 57.7265C1.91144 57.5085 2.4715 57.5085 3.5916 57.5085L54.2278 57.5085Z',
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

function BrandMark({ opacity, scale, lineScale, lineOpacity, middleOpacity }) {
  return (
    <motion.svg
      className="brand-icon"
      viewBox="0 0 58 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={false}
      aria-hidden="true"
      style={{
        x: '-50%',
        y: '-50%',
        opacity,
        scale,
      }}
    >
      <rect width="58" height="67" fill="black" />
      <motion.path
        d={brandMarkPaths.top}
        fill="white"
        style={{
          opacity: lineOpacity,
          scaleX: lineScale,
          originX: 0.5,
          originY: 0.5,
        }}
      />
      <motion.path
        d={brandMarkPaths.middle}
        fill="white"
        style={{
          opacity: middleOpacity,
        }}
      />
      <motion.path
        d={brandMarkPaths.bottom}
        fill="white"
        style={{
          opacity: lineOpacity,
          scaleX: lineScale,
          originX: 0.5,
          originY: 0.5,
        }}
      />
    </motion.svg>
  )
}

export default function App() {
  const videoRef = useRef(null)
  const [viewport, setViewport] = useState(getViewportState)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion)
  const [isMediaReady, setIsMediaReady] = useState(false)
  const [phase, setPhase] = useState(INTRO_PHASE.loading)
  const { scrollY } = useScroll()

  const hasIntroStarted = phase !== INTRO_PHASE.loading
  const isSettled =
    phase === INTRO_PHASE.holdFrame ||
    phase === INTRO_PHASE.revealBrand ||
    phase === INTRO_PHASE.complete
  const isQuoteExiting = phase === INTRO_PHASE.revealBrand || phase === INTRO_PHASE.complete
  const isBrandVisible = phase === INTRO_PHASE.complete
  const isScrollUnlocked = phase === INTRO_PHASE.complete
  const scrollDistance = isScrollUnlocked
    ? Math.max(viewport.frameSize * 1.35, viewport.height * 1.2)
    : 0
  const videoTravelDistance = viewport.frameSize + 48
  const scrollOffset = useTransform(() => {
    if (!isScrollUnlocked) {
      return 0
    }

    return Math.min(scrollY.get(), scrollDistance)
  })
  const smoothScrollOffset = useSpring(scrollOffset, {
    stiffness: prefersReducedMotion ? 1000 : 120,
    damping: prefersReducedMotion ? 100 : 24,
    mass: prefersReducedMotion ? 1 : 0.35,
  })
  const videoTranslateY = useTransform(() => {
    if (!isScrollUnlocked) {
      return 0
    }

    const progress = Math.min(smoothScrollOffset.get() / Math.max(scrollDistance, 1), 1)
    return -(progress * videoTravelDistance)
  })
  const brandOpacity = useTransform(() => {
    if (!isScrollUnlocked) {
      return isBrandVisible ? 1 : 0
    }

    const progress = Math.min(smoothScrollOffset.get() / Math.max(scrollDistance, 1), 1)
    return Math.max(1 - (progress * 3.5), 0)
  })
  const iconRevealProgress = useTransform(() => {
    if (!isScrollUnlocked) {
      return 0
    }

    const progress = Math.min(smoothScrollOffset.get() / Math.max(scrollDistance, 1), 1)
    if (progress <= 0.72) {
      return 0
    }

    return Math.min((progress - 0.72) / 0.2, 1)
  })
  const smoothIconReveal = useSpring(iconRevealProgress, {
    stiffness: prefersReducedMotion ? 1000 : 160,
    damping: prefersReducedMotion ? 100 : 24,
    mass: prefersReducedMotion ? 1 : 0.42,
  })
  const iconOpacity = useTransform(smoothIconReveal, [0, 0.2, 1], [0, 0.78, 1])
  const iconScale = useTransform(smoothIconReveal, [0, 1], [0.96, 1])
  const iconLineScale = useTransform(smoothIconReveal, [0, 0.78, 1], [0, 0.92, 1])
  const iconLineOpacity = useTransform(smoothIconReveal, [0, 0.12, 1], [0, 0.88, 1])
  const iconMiddleOpacity = useTransform(smoothIconReveal, [0, 0.35, 0.78, 1], [0, 0, 0.52, 1])

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
    <main
      className={`app-shell${isScrollUnlocked ? ' app-shell--scroll-unlocked' : ''}`}
      aria-labelledby="site-title"
      style={{
        minHeight: isScrollUnlocked ? `calc(100vh + ${scrollDistance}px)` : '100vh',
      }}
    >
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
            style={{ y: videoTranslateY }}
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
              style={{ opacity: brandOpacity }}
              animate={{
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

            <BrandMark
              opacity={iconOpacity}
              scale={iconScale}
              lineScale={iconLineScale}
              lineOpacity={iconLineOpacity}
              middleOpacity={iconMiddleOpacity}
            />
          </motion.div>
        </motion.div>
      </div>

      {isScrollUnlocked ? (
        <div
          className="scroll-runway"
          aria-hidden="true"
          style={{ height: `${scrollDistance}px` }}
        />
      ) : null}
    </main>
  )
}
