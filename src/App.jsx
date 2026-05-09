import React, { useCallback, useEffect, useRef, useState } from 'react'
import Chapter from './components/Chapter.jsx'
import Menu from './components/Menu.jsx'
import Intro from './components/Intro.jsx'
import Atmosphere from './components/Atmosphere.jsx'
import Soundtrack from './components/Soundtrack.jsx'
import Konami from './components/Konami.jsx'
import { CHAPTERS, SECTIONS } from './data/chapters.js'

const FADE_MS = 500

export default function App() {
  const [screen, setScreen] = useState('intro')
  const [fading, setFading] = useState(false)
  const pendingRef = useRef(null)

  const goto = useCallback(
    (next) => {
      if (next === screen) return
      pendingRef.current = next
      setFading(true)
      setTimeout(() => {
        setScreen(pendingRef.current)
        window.scrollTo({ top: 0, left: 0 })
        setTimeout(() => setFading(false), 30)
      }, FADE_MS)
    },
    [screen]
  )

  const flatChapterIds = SECTIONS.flatMap((s) => s.chapterIds || [])
  const currentChapter = CHAPTERS.find((c) => c.id === screen) || null
  const flatIdx = currentChapter ? flatChapterIds.indexOf(currentChapter.id) : -1
  const nextChapterId =
    flatIdx >= 0 && flatIdx < flatChapterIds.length - 1
      ? flatChapterIds[flatIdx + 1]
      : null

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [screen])

  return (
    <div className="app">
      {screen === 'intro' && <Intro onEnter={() => goto('menu')} />}

      {screen === 'menu' && (
        <Menu sections={SECTIONS} onPick={(chapterId) => goto(chapterId)} />
      )}

      {currentChapter && (
        <ChapterShell
          chapter={currentChapter}
          onMenu={() => goto('menu')}
          onNext={nextChapterId ? () => goto(nextChapterId) : null}
        />
      )}

      <div className={`fade-overlay ${fading ? 'is-on' : ''}`} aria-hidden="true">
        <div className="fade-overlay__inner">
          <span className="fade-overlay__dots">
            <span /><span /><span />
          </span>
        </div>
      </div>

      <div className={`iris-overlay ${fading ? 'is-on' : ''}`} aria-hidden="true" />

      <Atmosphere />
      <Soundtrack />
      <Konami />
    </div>
  )
}

function ChapterShell({ chapter, onMenu, onNext }) {
  const [progress, setProgress] = useState(0)
  const [showTitle, setShowTitle] = useState(true)

  // Reading progress (top bar) — % прокрутки текущей главы.
  useEffect(() => {
    let raf = 0
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      setProgress(p)
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [chapter.id])

  // Chapter title overlay — show on enter, fade out after 1.6s.
  useEffect(() => {
    setShowTitle(true)
    const t = setTimeout(() => setShowTitle(false), 1900)
    return () => clearTimeout(t)
  }, [chapter.id])

  return (
    <div className="chapter-shell">
      <div className="reading-bar" aria-hidden="true">
        <div className="reading-bar__fill" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className={`chapter-title-overlay ${showTitle ? 'is-on' : ''}`} aria-hidden="true">
        <div className="chapter-title-overlay__kicker">— Глава</div>
        <h2 className="chapter-title-overlay__name">
          <span>{chapter.title}</span>
        </h2>
      </div>

      <button
        type="button"
        className="floating-btn floating-btn--menu"
        onClick={onMenu}
        aria-label="В меню"
      >
        <span className="floating-btn__icon">←</span>
        <span className="floating-btn__label">Меню</span>
      </button>

      <Chapter chapter={chapter} />

      <button
        type="button"
        className="next-chapter-btn"
        onClick={onNext || onMenu}
        aria-label={onNext ? 'Следующая глава' : 'Вернуться в меню'}
      >
        <span>{onNext ? 'Дальше' : 'В меню'}</span>
        <span className="next-chapter-btn__arrow">{onNext ? '→' : '↺'}</span>
      </button>
    </div>
  )
}
