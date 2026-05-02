import React from 'react'
import Chapter from './components/Chapter.jsx'
import { CHAPTERS } from './data/chapters.js'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Исаак&nbsp;Шварц · Музыка кино</div>
        <nav className="nav">
          <a href="#part-0">Гл.1</a>
          <a href="#part-1">Гл.2</a>
          <a href="#part-2">Архив Дашкевич</a>
          <a href="#part-3">Гл.3</a>
          <a href="#part-4">Гл.4</a>
          <a href="#part-5">Архив Шварц</a>
        </nav>
      </header>

      <main className="feed">
        {CHAPTERS.map((c, idx) => (
          <Chapter key={c.id} chapter={c} anchor={`part-${idx}`} />
        ))}
      </main>

    </div>
  )
}
