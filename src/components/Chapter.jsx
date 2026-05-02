import React, { useEffect, useRef, useState, useCallback } from 'react'

export default function Chapter({ chapter, anchor }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  // Photo carousel state — driven by arrows / generic slider.
  const [photoIdx, setPhotoIdx] = useState(0)

  // Audio track state — driven ONLY by cassette clicks. Independent of photoIdx.
  const [trackIdx, setTrackIdx] = useState(null) // null until first cassette click
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '600px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const photoCount =
    chapter.slider?.pool.length ||
    chapter.archive?.pool.length ||
    1

  const advancePhoto = useCallback(
    (dir) => {
      setPhotoIdx((o) => ((o + dir) % photoCount + photoCount) % photoCount)
    },
    [photoCount]
  )

  // Cassette click: plays/stops the matching track. Does NOT touch photoIdx.
  const handleCassette = useCallback(
    (i) => {
      const el = audioRef.current
      if (trackIdx === i && el) {
        if (el.paused) {
          el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
        } else {
          el.pause()
          setPlaying(false)
        }
      } else {
        setTrackIdx(i)
        // autoplay handled by trackIdx effect below
      }
    },
    [trackIdx]
  )

  // Reload + autoplay when trackIdx changes (cassette switched).
  useEffect(() => {
    if (!chapter.archive || trackIdx == null) return
    const el = audioRef.current
    if (!el) return
    el.load()
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [trackIdx, chapter.archive])

  const aspect = (chapter.height / chapter.width) * 100
  const activePhoto = chapter.archive?.pool[photoIdx]
  const activeTrack = trackIdx != null ? chapter.archive?.pool[trackIdx] : null

  return (
    <section id={anchor} ref={ref} className="chapter">
      <div className="chapter__frame" style={{ paddingTop: `${aspect}%` }}>
        {visible ? (
          <>
            <object
              type="image/svg+xml"
              data={chapter.src}
              className="chapter__svg"
              aria-label={chapter.title}
            />

            {/* Posters carousel (chapter 1) */}
            {chapter.slider &&
              chapter.slider.slots.map((slot, i) => {
                const idx = (i + photoIdx) % chapter.slider.pool.length
                return (
                  <SlideSlot
                    key={`slot-${i}-${idx}`}
                    slot={slot}
                    src={chapter.slider.pool[idx]}
                    label={`Постер ${idx + 1}`}
                  />
                )
              })}

            {/* Family archive — photo carousel + independent audio cassettes */}
            {chapter.archive && activePhoto && (
              <>
                <SlideSlot
                  key={`archive-${photoIdx}`}
                  slot={chapter.archive.slot}
                  src={activePhoto.photo}
                  label={`Архив · ${activePhoto.label}`}
                  caption={activePhoto.label}
                />

                {!chapter.archive.noAudio && activeTrack && (
                  <audio
                    ref={audioRef}
                    src={activeTrack.audio}
                    onEnded={() => setPlaying(false)}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
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
                      isPlaying={!chapter.archive.noAudio && isActive && playing}
                      label={trackLabel}
                      showLabel={chapter.archive.noAudio}
                      onClick={() =>
                        chapter.archive.noAudio
                          ? setPhotoIdx(c.trackIndex % photoCount)
                          : handleCassette(c.trackIndex)
                      }
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
          </>
        ) : (
          <div className="chapter__placeholder" aria-hidden="true" />
        )}
      </div>
    </section>
  )
}

function SlideSlot({ slot, src, filter, label, caption }) {
  const style = {
    left: `${slot.x * 100}%`,
    top: `${slot.y * 100}%`,
    width: `${slot.w * 100}%`,
    height: `${slot.h * 100}%`,
  }
  return (
    <div className="slide-slot" style={style} aria-label={label}>
      <img
        src={src}
        alt={label}
        className="slide-slot__svg"
        style={filter ? { filter } : undefined}
        draggable={false}
      />
      {caption && <span className="slide-slot__caption">{caption}</span>}
    </div>
  )
}

function CassetteHit({ cfg, isActive, isPlaying, label, showLabel, onClick }) {
  const style = {
    left: `${cfg.x * 100}%`,
    top: `${cfg.y * 100}%`,
    width: `${cfg.w * 100}%`,
    height: `${cfg.h * 100}%`,
  }
  return (
    <button
      type="button"
      className={`cassette-hit ${isActive ? 'is-active' : ''} ${isPlaying ? 'is-playing' : ''} ${showLabel ? 'has-label' : ''}`}
      style={style}
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={label || (isPlaying ? 'Остановить трек' : isActive ? 'Воспроизвести трек' : 'Выбрать кассету')}
    >
      {showLabel && <span className="cassette-hit__label">{label}</span>}
      {isPlaying && (
        <span className="cassette-hit__eq" aria-hidden="true">
          <span /><span /><span />
        </span>
      )}
    </button>
  )
}

function ArrowHit({ arrow, onClick }) {
  const [pulse, setPulse] = useState(false)
  const trigger = () => {
    setPulse(true)
    setTimeout(() => setPulse(false), 350)
    onClick && onClick()
  }
  const style = {
    left: `${arrow.x * 100}%`,
    top: `${arrow.y * 100}%`,
    width: `${arrow.w * 100}%`,
    height: `${arrow.h * 100}%`,
  }
  return (
    <button
      type="button"
      className={`arrow-hit arrow-hit--${arrow.side} ${pulse ? 'is-pulse' : ''}`}
      style={style}
      onClick={trigger}
      aria-label={arrow.side === 'prev' ? 'Назад' : 'Вперёд'}
    />
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
    <div className="video-overlay" style={style}>
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
    </div>
  )
}
