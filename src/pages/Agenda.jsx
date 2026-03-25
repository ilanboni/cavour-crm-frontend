import { useState, useEffect } from "react"
import { api, fmtData, fmtOra } from "../api.js"

export default function Agenda() {
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("da_fare")

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (filter === "da_fare") params.completato = false
      if (filter === "completati") params.completato = true
      const data = await api.getAppuntamenti(params)
      setAppts(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function completa(id, e) {
    e.stopPropagation()
    try { await api.aggiornaAppuntamento(id, { completato: true }); load() } catch {}
  }

  async function conferma(id, e) {
    e.stopPropagation()
    try { await api.aggiornaAppuntamento(id, { confermato: true }); load() } catch {}
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div className="section-title" style={{ flex: 1, marginBottom: 0 }}>Agenda</div>
        <button className="btn btn-gold btn-sm">+ Nuovo appuntamento</button>
      </div>
      <div className="tabs">
        {[{ value: "da_fare", label: "Da fare" }, { value: "completati", label: "Completati" }, { value: "tutti", label: "Tutti" }].map(f => (
          <div key={f.value} className={`tab ${filter === f.value ? "active" : ""}`} onClick={() => setFilter(f.value)}>{f.label}</div>
        ))}
      </div>
      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : appts.length === 0 ? <div className="empty"><div className="empty-icon">◷</div>Nessun appuntamento</div>
          : appts.map(a => {
            const dt = new Date(a.data_ora)
            const isOggi = dt.toDateString() === new Date().toDateString()
            return (
              <div key={a.id} className="row-item">
                <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: isOggi ? "var(--gold-bg)" : "var(--dark-3)", border: isOggi ? "1px solid var(--gold-border)" : "1px solid var(--white-faint)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: isOggi ? "var(--gold)" : "var(--white-dim)", lineHeight: 1 }}>{dt.getDate()}</div>
                  <div style={{ fontSize: 9, color: "var(--white-muted)", textTransform: "uppercase" }}>{dt.toLocaleDateString("it-IT", { month: "short" })}</div>
                </div>
                <div className="row-body">
                  <div className="row-title">{a.cliente_nome||""} {a.cliente_cognome||""} {isOggi && <span className="badge badge-gold" style={{ marginLeft: 6 }}>Oggi</span>}</div>
                  <div className="row-sub">{[fmtOra(a.data_ora), a.luogo, a.tipo||"visita"].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="row-end" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  {!a.completato && !a.confermato && <button className="btn btn-outline btn-sm" onClick={e => conferma(a.id, e)}>Conferma</button>}
                  {!a.completato && <button className="btn btn-ghost btn-sm" onClick={e => completa(a.id, e)}>✓ Fatto</button>}
                  {a.completato && <span className="badge badge-gray">completato</span>}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
