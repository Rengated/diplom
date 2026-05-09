import React, { useEffect, useRef } from 'react'

// Декоративные ноты, плавают поверх SVG главы. Параллакс по window.scrollY
// — каждая нота движется со своим коэффициентом, чтобы возник эффект глубины.
// glyphs: ♩ ♪ ♫ ♬ — Unicode, без зависимостей.

const NOTE_GLYPHS = ['♪', '♫', '♬', '♩']

// fixed seed positions — чтобы при каждом ре-рендере ноты не прыгали.
// поля: top — % от высоты главы, left — % от ширины, size — vw,
// speed — параллакс-коэффициент (0.05..0.4), opacity, rot — стартовый угол.
const PRESETS = [
  { top: 4,  left: 8,  size: 3.2, speed: 0.18, opacity: 0.32, rot: -8,  glyph: 0 },
  { top: 11, left: 86, size: 4.6, speed: 0.32, opacity: 0.22, rot: 12,  glyph: 1 },
  { top: 20, left: 22, size: 3.8, speed: 0.10, opacity: 0.28, rot: 5,   glyph: 2 },
  { top: 30, left: 70, size: 5.2, speed: 0.26, opacity: 0.18, rot: -14, glyph: 3 },
  { top: 38, left: 4,  size: 4.0, speed: 0.40, opacity: 0.20, rot: 18,  glyph: 0 },
  { top: 46, left: 92, size: 3.4, speed: 0.14, opacity: 0.30, rot: -4,  glyph: 1 },
  { top: 54, left: 30, size: 4.4, speed: 0.36, opacity: 0.22, rot: 9,   glyph: 2 },
  { top: 62, left: 64, size: 3.0, speed: 0.08, opacity: 0.32, rot: -10, glyph: 3 },
  { top: 71, left: 12, size: 5.6, speed: 0.28, opacity: 0.16, rot: 14,  glyph: 0 },
  { top: 80, left: 80, size: 3.6, speed: 0.20, opacity: 0.26, rot: -6,  glyph: 2 },
  { top: 88, left: 40, size: 4.2, speed: 0.34, opacity: 0.20, rot: 4,   glyph: 1 },
  { top: 95, left: 58, size: 3.0, speed: 0.12, opacity: 0.30, rot: -16, glyph: 3 },
]

export default function ParallaxNotes({ density = 1, color = '#e8e2cf' }) {
  const layerRef = useRef(null)
  const itemsRef = useRef([])
  const baseRef = useRef(0)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const rect = layer.getBoundingClientRect()
    baseRef.current = rect.top + window.scrollY

    // курсор-отталкивание: дополнительный smooth offset для каждой ноты
    const localCursor = { x: -9999, y: -9999 }
    const PUSH_RADIUS = 140
    const PUSH_FORCE = 50

    let raf = 0
    let needsTick = true

    const tick = () => {
      const offset = window.scrollY - baseRef.current
      const layerRect = layer.getBoundingClientRect()
      let any = false

      for (const item of itemsRef.current) {
        if (!item.el) continue
        // позиция ноты в окне
        const r = item.el.getBoundingClientRect()
        const nx = r.left + r.width / 2
        const ny = r.top + r.height / 2
        const dx = nx - localCursor.x
        const dy = ny - localCursor.y
        const d = Math.sqrt(dx * dx + dy * dy)

        let pushX = 0, pushY = 0
        if (d < PUSH_RADIUS) {
          const f = (1 - d / PUSH_RADIUS) * PUSH_FORCE
          pushX = (dx / d) * f
          pushY = (dy / d) * f
        }

        item.curPushX += (pushX - item.curPushX) * 0.18
        item.curPushY += (pushY - item.curPushY) * 0.18

        const dyParallax = offset * item.speed
        item.el.style.transform =
          `translate3d(${item.curPushX.toFixed(1)}px, ${(dyParallax + item.curPushY).toFixed(1)}px, 0) rotate(${item.rot}deg)`

        if (Math.abs(item.curPushX - pushX) > 0.05 || Math.abs(item.curPushY - pushY) > 0.05) {
          any = true
        }
      }
      raf = any || needsTick ? requestAnimationFrame(tick) : 0
      needsTick = false
    }

    const onScroll = () => {
      needsTick = true
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e) => {
      localCursor.x = e.clientX
      localCursor.y = e.clientY
      needsTick = true
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const presets = PRESETS.filter((_, i) => i % Math.max(1, Math.round(1 / density)) === 0)

  return (
    <div ref={layerRef} className="parallax-notes" aria-hidden="true">
      {presets.map((p, i) => (
        <span
          key={i}
          ref={(el) => {
            itemsRef.current[i] = { el, speed: p.speed, rot: p.rot, curPushX: 0, curPushY: 0 }
          }}
          className="parallax-notes__item"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            fontSize: `${p.size}vw`,
            opacity: p.opacity,
            color,
            '--rot': `${p.rot}deg`,
          }}
        >
          <span className="parallax-notes__glyph">{NOTE_GLYPHS[p.glyph]}</span>
        </span>
      ))}
    </div>
  )
}
