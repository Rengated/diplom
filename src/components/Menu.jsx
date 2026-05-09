import React, { useState } from 'react'

export default function Menu({ sections, onPick }) {
  const [hoverIdx, setHoverIdx] = useState(-1)
  const hovered = hoverIdx >= 0 ? sections[hoverIdx] : null

  return (
    <div className="menu">
      <div className="menu__bg" aria-hidden="true" />

      {/* плавающая огромная цифра при hover пункта */}
      <div className={`menu__ghost ${hovered ? 'is-on' : ''}`} aria-hidden="true">
        {hovered ? String(hoverIdx + 1).padStart(2, '0') : '00'}
      </div>

      <header className="menu__header">
        <div className="menu__kicker">— Меню</div>
        <h1 className="menu__title">
          <span className="menu__title-l1">Композиторы</span>
          <span className="menu__title-l2">советского кино</span>
        </h1>
        <p className="menu__lead">
          Выберите раздел, чтобы погрузиться в историю.
        </p>
      </header>

      <ul className="menu__list">
        {sections.map((s, i) => (
          <li
            key={s.id}
            className={`menu__item ${hoverIdx === i ? 'is-hover' : ''} ${hoverIdx >= 0 && hoverIdx !== i ? 'is-dim' : ''}`}
            style={{ '--i': i }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(-1)}
          >
            <button
              type="button"
              className="menu__btn"
              onClick={() => onPick(s.chapterIds[0])}
              data-magnetic
            >
              <span className="menu__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="menu__col">
                <span className="menu__name">{s.title}</span>
                <span className="menu__sub">{s.subtitle}</span>
              </span>
              <span className="menu__line" aria-hidden="true" />
              <span className="menu__arrow" aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ul>

      <footer className="menu__footer">
        <span>Дипломный проект · 2026</span>
      </footer>
    </div>
  )
}
