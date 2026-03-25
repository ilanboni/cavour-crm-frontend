import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, fmt, fmtMq, fmtData, fmtOra } from '../api.js'

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-f9d5d.up.railway.app'

const objectives = [
  'Contatta almeno 3 privati con messaggio personalizzato',
  'Follow-up clienti 4-5 stelle in scadenza',
  'Proponi almeno 1 immobile a un acquirente',
  'Verifica e aggiorna appuntamenti di oggi',
  'Aggiorna stato di almeno 2 immobili in gestione',
]

function Stars({ n = 3 }) {
  return <span className="stars">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

function CoachCard({ stats }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(Array(objectives.length).fill(false))

  useEffect(() => {
    generateCoachMessage()
  }, [])

  async function generateCoachMessage() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/coach/briefing`)
      const data = await res.json()
      setMsg(data.message || fallbackMessage())
    } catch {
      setMsg(fallbackMessage())
    }
    setLoading(false)
  }

  function fallbackMessage() {
    const ora = new Date().getHours()
    const saluto = ora < 12 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'
    return saluto + ' Ilan. Analizza i dati e vai.'
  }

  const doneCount = done.filter(Boolean).length
  const pct = Math.round(doneCount / objectives.length * 100)

  return (
    <div className="coach-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--gold)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16, color: 'var(--black)', fontWeight: 600
        }}>★</div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
            Coach AI — Briefing del giorno
          </div>
        </div>
      </div>

      <div className="coach-message">
        {loading ? (
          <span style={{ color: 'var(--white-muted)', fontSize: 14 }}>Analizzando i tuoi dati...</span>
        ) : msg}
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        {objectives.map((obj, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '0.5rem', opacity: done[i] ? 0.5 : 1
          }}>
            <div
              onClick={() => {
                const next = [...done]
                next[i] = !next[i]
                setDone(next)
              }}
              style={{
                width: 18, height: 18, borderRadius: '50%',
                border: done[i] ? 'none' : '1.5px solid var(--gold-border-strong)',
                background: done[i] ? 'var(--gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                fontSize: 10, color: 'var(--black)', fontWeight: 700
              }}
            >
              {done[i] ? '✓' : ''}
            </div>
            <span style={{
              fontSize: 12, color: 'var(--white-dim)',
              textDecoration: done[i] ? 'line-through' : 'none'
            }}>{obj}</span>
          </div>
        ))}
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: pct + '%' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--white-muted)', marginTop: '0.35rem' }}>
        {doneCount} / {objectives.length} obiettivi completati oggi
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ nClienti: 0, nImm: 0, nPrivati: 0, nMatching: 0 })
  const [privati, setPrivati] = useState([])
  const [multi, setMulti] = useState([])
  const [appt, setAppt] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [c, i, ext, match, apptData, multiData] = await Promise.all([
        api.getClienti({ limit: 200 }),
        api.getImmobili({ limit: 50 }),
        api.getImmobiliEsterni({ tipo_fonte: 'privato', stato_contatto: 'nuovo', limit: 10 }),
        api.getMatching({ proposto: false, limit: 50 }),
        api.getAppuntamenti({ completato: false, limit: 5 }),
        api.getImmobiliEsterni({ tipo_fonte: 'multiagenzia', limit: 5 }),
      ])
      const nPrivati = ext.total || (ext.data || []).length
      const nMatching = Array.isArray(match) ? match.length : 0
      setStats({
        nClienti: c.total || 0,
        nImm: (i.data || []).length,
        nPrivati,
        nMatching,
      })
      setPrivati(ext.data || [])
      setAppt(Array.isArray(apptData) ? apptData : [])
      setMulti(multiData.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function openWA(telefono, nome) {
    if (!telefono) return alert('Numero non disponibile')
    const num = telefono.replace(/\D/g, '')
    const msg = encodeURIComponent(`Buongiorno${nome ? ' ' + nome : ''},\nSono Ilan Boni di Cavour Immobiliare.\nHo visto il suo immobile e mi piacerebbe parlarne con lei.\n\nIlan Boni\nCavour Immobiliare · Via Statuto 10, Milano`)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  return (
    <div>
      <CoachCard stats={stats} />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Clienti attivi</div>
          <div className="stat-value gold">{loading ? '—' : stats.nClienti}</div>
          <div className="stat-delta">acquirenti + venditori</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mandati attivi</div>
          <div className="stat-value">{loading ? '—' : stats.nImm}</div>
          <div className="stat-delta">immobili in gestione</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Privati da contattare</div>
          <div className="stat-value gold">{loading ? '—' : stats.nPrivati}</div>
          <div className="stat-delta up">↑ opportunità oggi</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Matching da proporre</div>
          <div className="stat-value">{loading ? '—' : stats.nMatching}</div>
          <div className="stat-delta">abbinamenti pronti</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="section-header">
            <div className="section-title" style={{ flex: 1 }}>Privati — contatta subito</div>
          </div>
          <div className="card">
            {loading ? <div className="loading">Caricamento...</div>
              : privati.length === 0 ? <div className="empty"><div className="empty-icon">◎</div>Nessun privato nuovo oggi</div>
              : privati.map(p => (
                <div key={p.id} className="row-item" onClick={() => navigate('/scouting')}>
                  <div className="row-avatar avatar-red">P</div>
                  <div className="row-body">
                    <div className="row-title">{p.indirizzo || p.titolo}</div>
                    <div className="row-sub">{p.zona || ''}{p.mq ? ` · ${p.mq} mq` : ''}{p.contatto_nome ? ` · ${p.contatto_nome}` : ''}</div>
                  </div>
                  <div className="row-end">
                    <div className="row-price">{fmt(p.prezzo)}</div>
                    <button
                      className="btn btn-wa"
                      style={{ marginTop: 4 }}
                      onClick={e => { e.stopPropagation(); openWA(p.contatto_telefono, p.contatto_nome) }}
                    >WA</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div>
          <div className="section-title">Follow-up urgenti</div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="row-item">
              <div className="row-avatar avatar-gold">★</div>
              <div className="row-body">
                <div className="row-title">Sig.ra D'Amato</div>
                <div className="row-sub">Non contattata da 5 giorni</div>
              </div>
              <div className="row-end">
                <Stars n={5} />
                <button className="btn btn-wa" style={{ marginTop: 4 }} onClick={() => openWA('+393351321986', "D'Amato")}>WA</button>
              </div>
            </div>
            <div className="row-item">
              <div className="row-avatar avatar-gold">★</div>
              <div className="row-body">
                <div className="row-title">Sig. Troina</div>
                <div className="row-sub">Non contattato da 7 giorni</div>
              </div>
              <div className="row-end">
                <Stars n={4} />
                <button className="btn btn-wa" style={{ marginTop: 4 }} onClick={() => openWA('+393471027019', 'Troina')}>WA</button>
              </div>
            </div>
            <div className="row-item">
              <div className="row-avatar avatar-gold">★</div>
              <div className="row-body">
                <div className="row-title">Yael Rosenholz</div>
                <div className="row-sub">Non contattata da 3 giorni</div>
              </div>
              <div className="row-end">
                <Stars n={5} />
                <button className="btn btn-wa" style={{ marginTop: 4 }} onClick={() => openWA('+393899244145', 'Yael')}>WA</button>
              </div>
            </div>
          </div>

          <div className="section-title">Appuntamenti oggi</div>
          <div className="card">
            {appt.length === 0
              ? <div className="empty"><div className="empty-icon">◷</div>Nessun appuntamento oggi</div>
              : appt.map(a => (
                <div key={a.id} className="row-item">
                  <div className="row-avatar avatar-blue">C</div>
                  <div className="row-body">
                    <div className="row-title">{a.cliente_nome || ''} {a.cliente_cognome || ''}</div>
                    <div className="row-sub">{a.luogo || ''} · {a.tipo || 'visita'}</div>
                  </div>
                  <div className="row-end">
                    <div className="row-price" style={{ fontSize: 12 }}>{fmtOra(a.data_ora)}</div>
                    <span className={`badge ${a.confermato ? 'badge-green' : 'badge-gray'}`}>
                      {a.confermato ? 'confermato' : 'da confermare'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="section-title">Multi-agenzia — opportunità mandato</div>
      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : multi.length === 0
          ? <div className="empty"><div className="empty-icon">⬡</div>Nessun immobile multi-agenzia trovato</div>
          : multi.map(p => (
            <div key={p.id} className="row-item" onClick={() => navigate('/scouting')}>
              <div className="row-avatar avatar-gold">M</div>
              <div className="row-body">
                <div className="row-title">{p.indirizzo || p.titolo}</div>
                <div className="row-sub">{p.zona || ''}{p.mq ? ` · ${p.mq} mq` : ''} · Multi-agenzia</div>
              </div>
              <div className="row-end">
                <div className="row-price">{fmt(p.prezzo)}</div>
                <span className="badge badge-gold">Mandato</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
