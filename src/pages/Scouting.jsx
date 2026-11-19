import { useState, useEffect } from "react"
import { api, fmt } from "../api.js"

const TIPI = [{ value: "", label: "Tutti" }, { value: "privato", label: "Privati" }, { value: "multiagenzia", label: "Multi-agenzia" }, { value: "agenzia_singola", label: "Agenzia singola" }, { value: "non_esclusive", label: "Non esclusive" }]
// Lo stock delle agenzie che non lavorano in esclusiva ha stato_contatto
// 'stock_agenzia', mai 'nuovo': i filtri di stato lo nasconderebbero
// sempre, quindi su quella scheda non si mostrano.
const STATI = [{ value: "nuovo", label: "Nuovi" }, { value: "contattato", label: "Contattati" }, { value: "risposto", label: "Risposto" }, { value: "", label: "Tutti" }]

function WAModal({ immobile, onClose, onSent }) {
  const [msg, setMsg] = useState(
    "Buongiorno" + (immobile.contatto_nome ? " " + immobile.contatto_nome : "") + ",\n\n" +
    "Sono Ilan Boni di Cavour Immobiliare.\n" +
    "Ho visto il suo immobile" + (immobile.indirizzo ? " in " + immobile.indirizzo : "") + " e mi piacerebbe parlarne con lei.\n\n" +
    "Siamo un agenzia boutique che segue massimo 5 immobili alla volta.\n\n" +
    "E disponibile per una breve chiamata?\n\n" +
    "Ilan Boni\nCavour Immobiliare - Via Statuto 10, Milano"
  )

  function send() {
    if (!immobile.contatto_telefono) { alert("Numero non disponibile"); return }
    const num = immobile.contatto_telefono.replace(/\D/g, "")
    window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(msg), "_blank")
    onSent(immobile.id, msg)
    onClose()
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--dark-2)", border: "1px solid var(--gold-border)", borderRadius: 14, width: "100%", maxWidth: 480 }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--gold-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--white)" }}>Messaggio WhatsApp</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>X</button>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: 12, color: "var(--white-muted)", marginBottom: "0.75rem" }}>{immobile.indirizzo || immobile.titolo} - {immobile.contatto_telefono || "—"}</div>
          <textarea className="input" rows={8} value={msg} onChange={e => setMsg(e.target.value)} style={{ resize: "vertical", marginBottom: "0.75rem", fontSize: 12, lineHeight: 1.6 }} />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button className="btn btn-wa" style={{ fontSize: 13, padding: "0.5rem 1rem" }} onClick={send}>Apri WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Scouting() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState("")
  const [stato, setStato] = useState("nuovo")
  const [waModal, setWaModal] = useState(null)

  useEffect(() => { load() }, [tipo, stato])

  async function load() {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (tipo) params.tipo_fonte = tipo
      if (stato && tipo !== "non_esclusive") params.stato_contatto = stato
      const data = await api.getImmobiliEsterni(params)
      setList(data.data || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleSent(id, messaggio) {
    try { await api.aggiornaStatoContatto(id, "contattato", messaggio); load() } catch {}
  }

  const tipoBadge = { privato: "badge-red", multiagenzia: "badge-gold", agenzia_singola: "badge-green" }
  const tipoLabel = { privato: "Privato", multiagenzia: "Multi-ag.", agenzia_singola: "Agenzia" }
  const tipoAvatar = { privato: "avatar-red", multiagenzia: "avatar-gold", agenzia_singola: "avatar-green" }
  const nonEsclusive = tipo === "non_esclusive"

  // Da quanto l'annuncio e' fermo. E' l'ultimo aggiornamento dichiarato da
  // Idealista, non la prima pubblicazione: chi rilancia l'annuncio lo
  // azzera. Serve a mettere in cima i proprietari che aspettano da piu'
  // tempo, che sono quelli che ascoltano.
  function fermoDa(g) {
    if (g === null || g === undefined) return null
    if (g < 31) return g + " gg"
    const m = Math.round(g / 30)
    return m + (m === 1 ? " mese" : " mesi")
  }

  return (
    <div>
      {waModal && <WAModal immobile={waModal} onClose={() => setWaModal(null)} onSent={handleSent} />}
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div className="section-title" style={{ flex: 1, marginBottom: 0 }}>Scouting — {total} immobili</div>
      </div>
      <div className="tabs">
        {TIPI.map(t => <div key={t.value} className={"tab " + (tipo === t.value ? "active" : "")} onClick={() => setTipo(t.value)}>{t.label}</div>)}
      </div>
      {nonEsclusive ? (
        <div style={{ fontSize: 12, color: "var(--white-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
          Stock delle agenzie che condividono quasi tutto quello che trattano: qui dentro l'esclusiva
          quasi certamente non c'e', anche sugli annunci che vediamo una volta sola. Si va dal
          proprietario, non dall'agenzia. In cima chi aspetta da piu' tempo.
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          {STATI.map(s => <button key={s.value} className={"btn btn-sm " + (stato === s.value ? "btn-gold" : "btn-ghost")} onClick={() => setStato(s.value)}>{s.label}</button>)}
        </div>
      )}
      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : list.length === 0 ? <div className="empty"><div className="empty-icon">*</div>{nonEsclusive
              ? "La raccolta gira il lunedi mattina: qui comparira lo stock delle agenzie in classifica."
              : "Nessun immobile trovato"}</div>
          : list.map(p => (
            <div key={p.id} className="row-item">
              <div className={"row-avatar " + (tipoAvatar[p.tipo_fonte] || "avatar-gold")}>{(p.tipo_fonte||"P")[0].toUpperCase()}</div>
              <div className="row-body">
                <div className="row-title">{p.indirizzo || p.titolo}</div>
                <div className="row-sub">{(nonEsclusive
                  ? [p.zona, p.mq ? p.mq+" mq" : "", p.agenzia, fermoDa(p.giorni_fermo) ? "fermo da " + fermoDa(p.giorni_fermo) : ""]
                  : [p.zona, p.mq ? p.mq+" mq" : "", p.contatto_nome, p.contatto_telefono]).filter(Boolean).join(" - ")}</div>
              </div>
              <div className="row-end" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div className="row-price">{fmt(p.prezzo)}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <span className={"badge " + (nonEsclusive ? "badge-blue" : (tipoBadge[p.tipo_fonte] || "badge-gray"))}>{nonEsclusive ? "Non escl." : (tipoLabel[p.tipo_fonte] || p.tipo_fonte)}</span>
                  {!nonEsclusive && p.tipo_fonte === "privato" && p.stato_contatto === "nuovo" && (
                    <button className="btn btn-wa" onClick={e => { e.stopPropagation(); setWaModal(p) }}>WA</button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
