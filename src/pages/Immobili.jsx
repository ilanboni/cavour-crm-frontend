import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api, fmt, fmtMq } from "../api.js"

export default function Immobili() {
  const navigate = useNavigate()
  const [immobili, setImmobili] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.stato_vendita = filter
      const data = await api.getImmobili(params)
      setImmobili(data.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const stati = ["", "disponibile", "proposta", "compromesso", "rogitato", "ritirato"]
  const statiBadge = { disponibile: "badge-green", proposta: "badge-gold", compromesso: "badge-blue", rogitato: "badge-gray", ritirato: "badge-gray" }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div className="section-title" style={{ flex: 1, marginBottom: 0 }}>Immobili in gestione</div>
        <button className="btn btn-gold btn-sm">+ Nuovo</button>
      </div>
      <div className="tabs">
        {stati.map(s => (
          <div key={s} className={`tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s || "Tutti"}</div>
        ))}
      </div>
      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : immobili.length === 0 ? <div className="empty"><div className="empty-icon">⬡</div>Nessun immobile</div>
          : immobili.map(i => (
            <div key={i.id} className="row-item" onClick={() => navigate(`/immobili/${i.id}`)}>
              <div className="row-avatar avatar-gold">I</div>
              <div className="row-body">
                <div className="row-title">{i.indirizzo || i.titolo}</div>
                <div className="row-sub">{[i.zona, fmtMq(i.mq), i.proprietario_nome ? i.proprietario_nome+" "+(i.proprietario_cognome||"") : ""].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="row-end">
                <div className="row-price">{fmt(i.prezzo)}</div>
                <span className={`badge ${statiBadge[i.stato_vendita] || "badge-gray"}`}>{i.stato_vendita || "—"}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
