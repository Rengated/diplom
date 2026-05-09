import React, { useEffect, useRef, useState } from 'react'

// WebAudio ambient pad — 4 синусоиды (A minor) с медленным LFO,
// проходят через low-pass для мягкости. Стартует на первое user-действие
// (autoplay-policy не даёт играть до клика).

const FREQS = [110.0, 130.81, 164.81, 220.0] // A2, C3, E3, A3
const TARGET_GAIN = 0.12

export default function Soundtrack() {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const [muted, setMuted] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const start = () => {
      if (ctxRef.current) return
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return
        const ctx = new Ctx()
        const master = ctx.createGain()
        master.gain.value = 0
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1100
        filter.Q.value = 0.6
        master.connect(filter).connect(ctx.destination)

        FREQS.forEach((f, i) => {
          const osc = ctx.createOscillator()
          osc.type = i % 2 === 0 ? 'sine' : 'triangle'
          osc.frequency.value = f
          // лёгкий detune чтобы не звучало стерильно
          osc.detune.value = (Math.random() - 0.5) * 8

          const g = ctx.createGain()
          g.gain.value = 0.045
          osc.connect(g).connect(master)
          osc.start()

          // LFO на gain — ноты дышат независимо
          const lfo = ctx.createOscillator()
          lfo.frequency.value = 0.04 + i * 0.018
          const lfoGain = ctx.createGain()
          lfoGain.gain.value = 0.038
          lfo.connect(lfoGain).connect(g.gain)
          lfo.start()
        })

        // fade in
        master.gain.setValueAtTime(0, ctx.currentTime)
        master.gain.linearRampToValueAtTime(TARGET_GAIN, ctx.currentTime + 4.0)

        ctxRef.current = ctx
        masterRef.current = master
        setStarted(true)
      } catch (e) {
        // тихо игнорим
      }
    }
    const onAct = () => {
      start()
      window.removeEventListener('click', onAct)
      window.removeEventListener('keydown', onAct)
      window.removeEventListener('touchstart', onAct)
    }
    window.addEventListener('click', onAct)
    window.addEventListener('keydown', onAct)
    window.addEventListener('touchstart', onAct)
    return () => {
      window.removeEventListener('click', onAct)
      window.removeEventListener('keydown', onAct)
      window.removeEventListener('touchstart', onAct)
      const ctx = ctxRef.current
      if (ctx) {
        try { ctx.close() } catch (e) {}
      }
    }
  }, [])

  const toggle = () => {
    const m = masterRef.current
    const ctx = ctxRef.current
    if (!m || !ctx) return
    const next = !muted
    setMuted(next)
    const now = ctx.currentTime
    m.gain.cancelScheduledValues(now)
    m.gain.setValueAtTime(m.gain.value, now)
    m.gain.linearRampToValueAtTime(next ? 0 : TARGET_GAIN, now + 0.6)
  }

  if (!started) return null

  return (
    <button
      type="button"
      className={`soundtrack-btn ${muted ? 'is-muted' : 'is-on'}`}
      onClick={toggle}
      aria-label={muted ? 'Включить фоновую музыку' : 'Выключить фоновую музыку'}
      title={muted ? 'Включить фон' : 'Выключить фон'}
    >
      <span className="soundtrack-btn__bars" aria-hidden="true">
        <span /><span /><span /><span />
      </span>
      <span className="soundtrack-btn__label">{muted ? 'фон выкл' : 'фон'}</span>
    </button>
  )
}
