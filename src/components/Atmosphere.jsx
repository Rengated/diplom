import React, { useEffect, useRef, useState } from 'react'

// Atmosphere — глобальный слой эффектов: film grain (canvas-noise) + кастомный курсор.
// Курсор «магнитится» к интерактивным элементам (data-magnetic).

const TRAIL_COUNT = 5

export default function Atmosphere() {
  const grainRef = useRef(null)
  const cursorRef = useRef(null)
  const trailRefs = useRef([])
  const [hidden, setHidden] = useState(true)

  // Film grain — рисуем noise в canvas, перерисовываем 24 fps.
  useEffect(() => {
    const canvas = grainRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let last = 0
    const FPS = 24
    const STEP = 1000 / FPS

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth / 2)
      canvas.height = Math.floor(window.innerHeight / 2)
    }
    resize()
    window.addEventListener('resize', resize)

    const drawGrain = () => {
      const w = canvas.width
      const h = canvas.height
      const img = ctx.createImageData(w, h)
      const data = img.data
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0
        data[i] = data[i + 1] = data[i + 2] = v
        data[i + 3] = 18 // alpha — тонкий шум
      }
      ctx.putImageData(img, 0, 0)
    }

    const tick = (t) => {
      if (t - last >= STEP) {
        drawGrain()
        last = t
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Custom cursor — мягко догоняет мышь, прилипает к [data-magnetic]
  useEffect(() => {
    const el = cursorRef.current
    if (!el) return

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let cx = mx
    let cy = my
    let scale = 1
    let raf = 0
    let target = null // когда наведено на magnetic — центр элемента

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      setHidden(false)
      // если наведено на интерактив
      const t = e.target.closest('[data-magnetic], button, a, .cassette-hit, .arrow-hit, .menu__btn, .floating-btn, .next-chapter-btn, .intro__enter, input[type="range"]')
      if (t && t.getBoundingClientRect) {
        const r = t.getBoundingClientRect()
        target = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height }
      } else {
        target = null
      }
    }
    const onLeave = () => setHidden(true)

    // trail history — chain of N positions, each slower than previous
    const trail = Array.from({ length: TRAIL_COUNT }, () => ({ x: mx, y: my }))

    const tick = () => {
      let tx = mx
      let ty = my
      if (target) {
        tx = target.cx + (mx - target.cx) * 0.2
        ty = target.cy + (my - target.cy) * 0.2
      }
      cx += (tx - cx) * 0.22
      cy += (ty - cy) * 0.22
      const want = target ? Math.min(2.4, Math.max(target.w, target.h) / 24) : 1
      scale += (want - scale) * 0.18
      el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${scale})`
      el.classList.toggle('is-magnetic', !!target)

      // trail chain — каждая точка догоняет предыдущую с убывающей скоростью
      let prevX = cx
      let prevY = cy
      for (let i = 0; i < trail.length; i++) {
        const k = 0.32 - i * 0.04
        trail[i].x += (prevX - trail[i].x) * k
        trail[i].y += (prevY - trail[i].y) * k
        const node = trailRefs.current[i]
        if (node) {
          node.style.transform = `translate(${trail[i].x}px, ${trail[i].y}px) translate(-50%, -50%)`
        }
        prevX = trail[i].x
        prevY = trail[i].y
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <>
      <canvas ref={grainRef} className="film-grain" aria-hidden="true" />
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el }}
          className={`cursor-trail ${hidden ? 'is-hidden' : ''}`}
          style={{ '--i': i }}
          aria-hidden="true"
        />
      ))}
      <div
        ref={cursorRef}
        className={`custom-cursor ${hidden ? 'is-hidden' : ''}`}
        aria-hidden="true"
      />
    </>
  )
}
