import React, { useEffect, useState } from 'react'

const TITLE_LINES = [
  ['Музыка'],
  ['советского', 'кино'],
]

export default function Intro({ onEnter }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`intro ${ready ? 'is-ready' : ''}`}>
      <div className="intro__bg" aria-hidden="true" />

      {/* кинолента сверху */}
      <div className="film-strip film-strip--top" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="film-strip film-strip--bot" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="intro__content">
        <div className="intro__kicker">
          {'Дипломный проект'.split('').map((ch, i) => (
            <span key={i} style={{ '--i': i }}>{ch === ' ' ? ' ' : ch}</span>
          ))}
        </div>

        <h1 className="intro__title">
          {TITLE_LINES.map((line, li) => (
            <span key={li} className="intro__line">
              {line.map((word, wi) => (
                <span
                  key={wi}
                  className="intro__word"
                  style={{ '--i': li * 4 + wi }}
                >
                  <span className="intro__word-inner">{word}</span>
                </span>
              ))}
            </span>
          ))}
        </h1>

        <div className="intro__sub">
          <span>Исаак&nbsp;Шварц</span>
          <span className="intro__sub-dot" />
          <span>Владимир&nbsp;Дашкевич</span>
        </div>

        <a className="intro__scroll-hint" href="#enter">
          <span>Прокрутите вниз</span>
          <span className="intro__scroll-mouse" aria-hidden="true">
            <span />
          </span>
        </a>
      </div>

      {/* Второй экран — кнопка «Войти» */}
      <div className="intro__screen-2" id="enter">
        <div className="intro__screen-2-inner">
          <div className="intro__screen-2-kicker">— Готовы?</div>
          <div className="intro__screen-2-text">
            <span>Зрительный зал</span><br />
            <span>заполняется.</span>
          </div>
          <button
            type="button"
            className="intro__enter"
            onClick={onEnter}
            aria-label="Войти"
          >
            <span className="intro__enter-bg" aria-hidden="true" />
            <span className="intro__enter-text">Войти</span>
            <span className="intro__enter-arrow">→</span>
          </button>
        </div>
      </div>

      {/* плавающие частицы */}
      <div className="intro__sparks" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--d': `${4 + Math.random() * 6}s`,
              '--dly': `${-Math.random() * 6}s`,
              '--s': `${0.6 + Math.random() * 1.6}px`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
