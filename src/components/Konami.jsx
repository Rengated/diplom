import React, { useEffect, useState } from 'react'

const SEQ = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

const FALLING_GLYPHS = ['♪', '♫', '♬', '♩', '♭', '♯', '𝄞']

export default function Konami() {
  const [active, setActive] = useState(false)
  const [drops, setDrops] = useState([])

  useEffect(() => {
    let buf = []
    const onKey = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      buf.push(k)
      if (buf.length > SEQ.length) buf = buf.slice(-SEQ.length)
      if (buf.length === SEQ.length && SEQ.every((s, i) => s === buf[i])) {
        trigger()
        buf = []
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const trigger = () => {
    setActive(true)
    const arr = Array.from({ length: 80 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 1.6,
      dur: 3 + Math.random() * 3,
      size: 16 + Math.random() * 36,
      glyph: FALLING_GLYPHS[Math.floor(Math.random() * FALLING_GLYPHS.length)],
      rot: -45 + Math.random() * 90,
    }))
    setDrops(arr)
    setTimeout(() => {
      setActive(false)
      setDrops([])
    }, 6000)
  }

  return (
    <>
      <div className={`konami-flash ${active ? 'is-on' : ''}`} aria-hidden="true" />
      {active && (
        <div className="konami-toast" role="status">
          <span className="konami-toast__kicker">— Секретный кадр</span>
          <span className="konami-toast__text">Композитор бы оценил</span>
        </div>
      )}
      <div className="konami-rain" aria-hidden="true">
        {drops.map((d) => (
          <span
            key={d.id}
            className="konami-rain__note"
            style={{
              left: `${d.x}%`,
              fontSize: `${d.size}px`,
              animationDuration: `${d.dur}s`,
              animationDelay: `${d.delay}s`,
              transform: `rotate(${d.rot}deg)`,
            }}
          >
            {d.glyph}
          </span>
        ))}
      </div>
    </>
  )
}
