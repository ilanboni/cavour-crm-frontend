import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api.js"

const RUOLI = [
  { value: "", label: "Tutti" },
  { value: "acquirente", label: "Acquirenti" },
  { value: "venditore", label: "Venditori" },
  { value: "contatto", label: "Lead" },
]

export default function Clienti() {
  const navigate = useNavigate()
  const [clienti, setClienti] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ruolo, setRuolo] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => { load() }, [ruolo])

  async function load() {
    setLoading(true)
    try {
      const params = { limit: 150 }
      if (ruolo) params.ruolo = ruolo
      const data = await api.getClienti(params)
      setClienti(data.data || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = search
    ? clienti.filter(c => {
        const s = search.toLowerCase()
        return (c.nome||"").toLowerCase().includes(s) || (c.cognome||"").toLowerCase().includes(s) || (c.telefono||"").includes(s)
      })
    : clienti

  const ruoloBadge = { acquirente: "badge-green", venditore: "badge-gold", acquirente_venditore: "badge-blue", contatto: "badge-gray" }
  const ruoloLabel = { acquirente: "Acquirente", venditore: "Venditore", acquirente_venditore: "Acq/Vend", contatto: "Lead" }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: 360 }}>
          <input className="input" placeholder="Cerca nome, telefono..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: 12, color: "var(--white-muted)" }}>{total} clienti</span>
          <button className="btn btn-gold btn-sm">+ Nuovo</button>
        </div>
      </div>
      <div className="tabs">
        {RUOLI.map(r => (
          <div key={r.value} className={`tab ${ruolo === r.value ? "active" : ""}`} onClick={() => setRuolo(r.value)}>{r.label}</div>
        ))}
      </div>
      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : filtered.length === 0 ? <div className="empty"><div className="empty-icon">◉</div>Nessun cliente</div>
          : filtered.map(c => {
            const nome = [c.appellativo, c.nome, c.cognome].filter(Boolean).join(" ")
            return (
              <div key={c.id} className="row-item" onClick={() => navigate(`/clienti/${c.id}`)}>
                <div className={`row-avatar ${c.ruolo === "venditore" ? "avatar-gold" : c.ruolo === "acquirente" ? "avatar-green" : "avatar-blue"}`}>
                  {(c.nome || c.cognome || "?")[0].toUpperCase()}
                </div>
                <div className="row-body">
                  <div className="row-title">{nome || "Cliente senza nome"}</div>
                  <div className="row-sub">{c.telefono || c.email || "—"}</div>
                </div>
                <div className="row-end" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={`badge ${ruoloBadge[c.ruolo] || "badge-gray"}`}>{ruoloLabel[c.ruolo] || c.ruolo}</span>
                  <span className="stars">{"★".repeat(c.rating||3)}{"☆".repeat(5-(c.rating||3))}</span>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
