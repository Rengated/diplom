import React, { useEffect, useRef, useState, useCallback } from 'react'
import ParallaxNotes from './ParallaxNotes.jsx'

const NOTES_CHAPTERS = new Set(['ch2', 'ch3', 'ch5', 'ch6'])

export default function Chapter({ chapter }) {
  const ref = useRef(null)

  const [photoIdx, setPhotoIdx] = useState(0)
  const [prevPhotoIdx, setPrevPhotoIdx] = useState(null)

  const [trackIdx, setTrackIdx] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume, trackIdx])

  const photoCount =
    chapter.slider?.pool.length || chapter.archive?.pool.length || 1

  const advancePhoto = useCallback(
    (dir) => {
      setPhotoIdx((o) => {
        const next = ((o + dir) % photoCount + photoCount) % photoCount
        setPrevPhotoIdx(o)
        return next
      })
    },
    [photoCount]
  )

  // Crossfade reset — drop prev layer once fade-in finishes.
  useEffect(() => {
    if (prevPhotoIdx == null) return
    const t = setTimeout(() => setPrevPhotoIdx(null), 520)
    return () => clearTimeout(t)
  }, [prevPhotoIdx, photoIdx])

  // Lazy-create WebAudio analyser the first time we have a real audio el.
  const ensureAnalyser = useCallback(() => {
    const el = audioRef.current
    if (!el || analyserRef.current) return
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const src = ctx.createMediaElementSource(el)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      src.connect(analyser)
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
    } catch (e) {
      // CORS / autoplay restrictions — silently degrade to non-reactive bars.
    }
  }, [])

  const handleCassette = useCallback(
    (i) => {
      const el = audioRef.current
      if (trackIdx === i && el) {
        if (el.paused) {
          ensureAnalyser()
          if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
          el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
        } else {
          el.pause()
          setPlaying(false)
        }
      } else {
        setTrackIdx(i)
      }
    },
    [trackIdx, ensureAnalyser]
  )

  useEffect(() => {
    if (!chapter.archive || trackIdx == null) return
    const el = audioRef.current
    if (!el) return
    el.load()
    ensureAnalyser()
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [trackIdx, chapter.archive, ensureAnalyser])

  // Stop audio when leaving chapter.
  useEffect(() => {
    return () => {
      const el = audioRef.current
      if (el) {
        el.pause()
        el.src = ''
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch (e) {}
        audioCtxRef.current = null
        analyserRef.current = null
      }
    }
  }, [])

  const onTimeUpdate = (e) => {
    const el = e.currentTarget
    if (el.duration && !isNaN(el.duration)) {
      setProgress(el.currentTime)
      setDuration(el.duration)
    }
  }

  const onLoadedMetadata = (e) => {
    setDuration(e.currentTarget.duration || 0)
  }

  const onSeek = (e) => {
    const el = audioRef.current
    if (!el || !duration) return
    const t = parseFloat(e.target.value)
    el.currentTime = t
    setProgress(t)
  }

  const aspect = (chapter.height / chapter.width) * 100
  const activePhoto = chapter.archive?.pool[photoIdx]
  const prevPhoto =
    prevPhotoIdx != null ? chapter.archive?.pool[prevPhotoIdx] : null
  const activeTrack = trackIdx != null ? chapter.archive?.pool[trackIdx] : null

  const sectionsCount = chapter.sections || 4
  const sections = Array.from({ length: sectionsCount }, (_, i) => i)

  const sectionStyle = chapter.accent
    ? { '--chapter-accent': chapter.accent }
    : undefined

  return (
    <section ref={ref} className="chapter" style={sectionStyle}>
      <div className="chapter__frame" style={{ paddingTop: `${aspect}%` }}>
        <object
          type="image/svg+xml"
          data={chapter.src}
          className="chapter__svg"
          aria-label={chapter.title}
        />

        {/* Маски-секции — нарезка SVG, каждая reveal по scroll */}
        <div className="chapter-sections" aria-hidden="true">
          {sections.map((i) => (
            <SectionReveal
              key={i}
              top={i / sectionsCount}
              height={1 / sectionsCount}
              index={i}
            />
          ))}
        </div>

        {NOTES_CHAPTERS.has(chapter.id) && (
          <ParallaxNotes density={1} />
        )}

        {chapter.slider &&
          chapter.slider.slots.map((slot, i) => {
            const idx = (i + photoIdx) % chapter.slider.pool.length
            return (
              <SlideSlot
                key={`slot-${i}-${idx}`}
                slot={slot}
                src={chapter.slider.pool[idx]}
                label={`Постер ${idx + 1}`}
                landing
                tilt
              />
            )
          })}

        {chapter.archive && (
          <>
            {prevPhoto && (
              <SlideSlot
                key={`archive-prev-${prevPhotoIdx}`}
                slot={chapter.archive.slot}
                src={prevPhoto.photo}
                label={`Архив · ${prevPhoto.label}`}
                fadeOut
              />
            )}
            {activePhoto && (
              <SlideSlot
                key={`archive-cur-${photoIdx}`}
                slot={chapter.archive.slot}
                src={activePhoto.photo}
                label={`Архив · ${activePhoto.label}`}
                caption={activePhoto.label}
                fadeIn
                landing
                kenBurns
                pulse={playing}
              />
            )}

            {playing && (
              <Vinyl slot={chapter.archive.slot} />
            )}

            {activeTrack && (
              <audio
                ref={audioRef}
                src={activeTrack.audio}
                onEnded={() => setPlaying(false)}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                preload="metadata"
              />
            )}

            {chapter.archive.cassettes.map((c, i) => {
              const isActive = trackIdx === c.trackIndex
              const trackLabel = chapter.archive.pool[c.trackIndex]?.label
              return (
                <CassetteHit
                  key={`cassette-${i}`}
                  cfg={c}
                  isActive={isActive}
                  isPlaying={isActive && playing}
                  label={trackLabel}
                  onClick={() => handleCassette(c.trackIndex)}
                />
              )
            })}
          </>
        )}

        {chapter.arrows &&
          chapter.arrows.map((a, i) => (
            <ArrowHit
              key={i}
              arrow={a}
              onClick={() => advancePhoto(a.side === 'next' ? 1 : -1)}
            />
          ))}

        {chapter.video && <VideoOverlay cfg={chapter.video} />}
      </div>

      {activeTrack && (
        <AudioPlayer
          track={activeTrack}
          playing={playing}
          progress={progress}
          duration={duration}
          analyser={analyserRef}
          volume={volume}
          onVolume={setVolume}
          onToggle={() => handleCassette(trackIdx)}
          onSeek={onSeek}
        />
      )}
    </section>
  )
}

function SlideSlot({ slot, src, filter, label, caption, landing, fadeIn, fadeOut, kenBurns, pulse, tilt }) {
  const ref = useRef(null)
  const innerRef = useRef(null)
  const [landed, setLanded] = useState(!landing)

  useEffect(() => {
    if (!landing) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setLanded(true)
            io.disconnect()
            break
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [landing])

  // 3D-tilt по позиции мыши над слотом
  useEffect(() => {
    if (!tilt) return
    const el = ref.current
    const inner = innerRef.current
    if (!el || !inner) return

    let rx = 0, ry = 0, tx = 0, ty = 0
    let raf = 0

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      tx = (px - 0.5) * 16   // -8..8 deg по Y
      ty = -(py - 0.5) * 16  // -8..8 deg по X
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onLeave = () => {
      tx = 0; ty = 0
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const tick = () => {
      rx += (ty - rx) * 0.18
      ry += (tx - ry) * 0.18
      inner.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
      if (Math.abs(ty - rx) > 0.05 || Math.abs(tx - ry) > 0.05) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [tilt])

  const style = {
    left: `${slot.x * 100}%`,
    top: `${slot.y * 100}%`,
    width: `${slot.w * 100}%`,
    height: `${slot.h * 100}%`,
  }
  const cls = [
    'slide-slot',
    landing ? 'has-landing' : '',
    landed ? 'is-landed' : '',
    fadeIn ? 'is-fadein' : '',
    fadeOut ? 'is-fadeout' : '',
    pulse ? 'is-pulse' : '',
    tilt ? 'has-tilt' : '',
  ].filter(Boolean).join(' ')

  return (
    <div ref={ref} className={cls} style={style} aria-label={label}>
      <div ref={innerRef} className="slide-slot__inner">
        <img
          src={src}
          alt={label}
          className={`slide-slot__svg ${kenBurns ? 'is-kenburns' : ''}`}
          style={filter ? { filter } : undefined}
          draggable={false}
        />
        {caption && <span className="slide-slot__caption">{caption}</span>}
      </div>
    </div>
  )
}

// SVG-винил, поверх архивного фото в правом нижнем углу slot'а.
// Появляется только когда играет — крутится за счёт CSS-анимации.
function Vinyl({ slot }) {
  const style = {
    left: `${(slot.x + slot.w) * 100}%`,
    top: `${(slot.y + slot.h) * 100}%`,
    width: `${slot.w * 28}%`,
    height: `${slot.w * 28}%`,
  }
  return (
    <div className="vinyl" style={style} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="vinyl__svg">
        <defs>
          <radialGradient id="vinyl-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#1a1a1a" />
            <stop offset="48%" stopColor="#0a0a0a" />
            <stop offset="55%" stopColor="#222" />
            <stop offset="62%" stopColor="#0a0a0a" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="url(#vinyl-grad)" />
        {[42, 52, 62, 72, 82].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
        ))}
        <circle cx="100" cy="100" r="32" fill="#e14646" />
        <circle cx="100" cy="100" r="6" fill="#0a0a0a" />
        <circle cx="100" cy="100" r="2" fill="#fff" opacity="0.6" />
        {/* highlight reflection sweep */}
        <path
          d="M 30 100 A 70 70 0 0 1 100 30"
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="22"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function CassetteHit({ cfg, isActive, isPlaying, label, onClick }) {
  const style = {
    left: `${cfg.x * 100}%`,
    top: `${cfg.y * 100}%`,
    width: `${cfg.w * 100}%`,
    height: `${cfg.h * 100}%`,
  }
  return (
    <button
      type="button"
      className={`cassette-hit ${isActive ? 'is-active' : ''} ${isPlaying ? 'is-playing' : ''}`}
      style={style}
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={label || (isPlaying ? 'Остановить трек' : isActive ? 'Воспроизвести трек' : 'Выбрать кассету')}
    >
      <span className="cassette-hit__label">{label}</span>
      {isPlaying && (
        <span className="cassette-hit__eq" aria-hidden="true">
          <span /><span /><span />
        </span>
      )}
    </button>
  )
}

function ArrowHit({ arrow, onClick }) {
  const ref = useRef(null)
  const iconRef = useRef(null)
  const trigger = () => onClick && onClick()

  // Magnetic — стрелочка тянется к курсору в hot-zone (3х размера hit-box).
  useEffect(() => {
    const btn = ref.current
    const icon = iconRef.current
    if (!btn || !icon) return

    let raf = 0
    let tx = 0, ty = 0
    let cx = 0, cy = 0
    let mouseInside = false

    const onMove = (e) => {
      const r = btn.getBoundingClientRect()
      const ox = r.left + r.width / 2
      const oy = r.top + r.height / 2
      const dx = e.clientX - ox
      const dy = e.clientY - oy
      const range = Math.max(r.width, r.height) * 2.2
      if (Math.abs(dx) > range || Math.abs(dy) > range) {
        if (mouseInside) {
          mouseInside = false
          tx = 0; ty = 0
          btn.classList.remove('is-near')
        }
        return
      }
      mouseInside = true
      btn.classList.add('is-near')
      tx = dx * 0.25
      ty = dy * 0.25
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const tick = () => {
      cx += (tx - cx) * 0.18
      cy += (ty - cy) * 0.18
      icon.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`
      if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const style = {
    left: `${arrow.x * 100}%`,
    top: `${arrow.y * 100}%`,
    width: `${arrow.w * 100}%`,
    height: `${arrow.h * 100}%`,
  }
  return (
    <button
      ref={ref}
      type="button"
      className={`arrow-hit arrow-hit--${arrow.side}`}
      style={style}
      onClick={trigger}
      aria-label={arrow.side === 'prev' ? 'Назад' : 'Вперёд'}
      data-magnetic
    >
      <svg ref={iconRef} className="arrow-hit__icon" viewBox="0 0 24 24" aria-hidden="true">
        {arrow.side === 'prev' ? (
          <path d="M15 5 L7 12 L15 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M9 5 L17 12 L9 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}

function VideoOverlay({ cfg }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)

  const start = () => {
    setPlaying(true)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {})
      }
    }, 50)
  }

  const style = {
    left: `${cfg.x * 100}%`,
    top: `${cfg.y * 100}%`,
    width: `${cfg.w * 100}%`,
    height: `${cfg.h * 100}%`,
  }

  return (
    <div className={`video-overlay ${playing ? 'is-playing' : ''}`} style={style}>
      {playing ? (
        <video
          ref={videoRef}
          src={cfg.src}
          controls
          autoPlay
          poster={cfg.poster}
          playsInline
        />
      ) : (
        <button
          type="button"
          className="video-overlay__poster"
          onClick={start}
          aria-label="Воспроизвести видео"
        >
          <span className="video-overlay__play" />
        </button>
      )}
      <span className="video-overlay__bar video-overlay__bar--top" aria-hidden="true" />
      <span className="video-overlay__bar video-overlay__bar--bot" aria-hidden="true" />
    </div>
  )
}

function AudioPlayer({ track, playing, progress, duration, analyser, volume, onVolume, onToggle, onSeek }) {
  const [showVol, setShowVol] = useState(false)
  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }
  return (
    <div className={`audio-player ${playing ? 'is-playing' : ''}`}>
      <button
        type="button"
        className="audio-player__btn"
        onClick={onToggle}
        aria-label={playing ? 'Пауза' : 'Играть'}
      >
        {playing ? (
          <span className="audio-player__pause">
            <span /><span />
          </span>
        ) : (
          <span className="audio-player__play" />
        )}
      </button>
      <Visualizer analyser={analyser} active={playing} />

      <div
        className={`audio-player__vol ${showVol ? 'is-open' : ''}`}
        onMouseEnter={() => setShowVol(true)}
        onMouseLeave={() => setShowVol(false)}
      >
        <button type="button" className="audio-player__vol-btn" aria-label="Громкость">
          <VolumeIcon level={volume} />
        </button>
        <div className="audio-player__vol-pop">
          <input
            type="range"
            className="audio-player__vol-range"
            min={0} max={1} step={0.01}
            value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            style={{ '--p': `${volume * 100}%` }}
            aria-label="Уровень громкости"
          />
        </div>
      </div>

      <div className="audio-player__meta">
        <div className="audio-player__title">{track.label}</div>
        <input
          type="range"
          className="audio-player__range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={progress}
          onChange={onSeek}
          style={{ '--p': duration ? `${(progress / duration) * 100}%` : '0%' }}
        />
        <div className="audio-player__time">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  )
}

function SectionReveal({ top, height, index }) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true)
            io.disconnect()
            break
          }
        }
      },
      { rootMargin: '-15% 0px -15% 0px', threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const style = {
    top: `${top * 100}%`,
    height: `${height * 100}%`,
    transitionDelay: `${index * 40}ms`,
  }
  return (
    <div
      ref={ref}
      className={`chapter-section ${revealed ? 'is-revealed' : ''}`}
      style={style}
    />
  )
}

function VolumeIcon({ level }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M3 9 V15 H7 L12 19 V5 L7 9 Z" fill="currentColor" />
      {level > 0.05 && (
        <path d="M15 9 Q17 12 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {level > 0.45 && (
        <path d="M17.5 7 Q20.5 12 17.5 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {level <= 0.05 && (
        <path d="M16 10 L20 14 M20 10 L16 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  )
}

function Visualizer({ analyser, active }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let phase = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const tick = () => {
      const w = canvas.getBoundingClientRect().width
      const h = canvas.getBoundingClientRect().height
      ctx.clearRect(0, 0, w, h)

      const BARS = 22
      const a = analyser?.current
      let arr = null
      if (a) {
        arr = new Uint8Array(a.frequencyBinCount)
        a.getByteFrequencyData(arr)
      }

      const gap = 3
      const bw = (w - gap * (BARS - 1)) / BARS
      phase += 0.06
      for (let i = 0; i < BARS; i++) {
        let v
        if (arr && active) {
          // взять из bin'а с весом по индексу
          const idx = Math.floor((i / BARS) * arr.length)
          v = arr[idx] / 255
        } else if (active) {
          // нет анализа (CORS) — синусоидная заглушка
          v = (Math.sin(phase + i * 0.4) * 0.5 + 0.5) * 0.6
        } else {
          v = 0.08
        }
        const bh = Math.max(2, v * h)
        const x = i * (bw + gap)
        const y = (h - bh) / 2
        ctx.fillStyle = active ? '#e14646' : 'rgba(232,226,207,0.35)'
        ctx.fillRect(x, y, bw, bh)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [analyser, active])

  return <canvas ref={ref} className="audio-player__viz" aria-hidden="true" />
}
