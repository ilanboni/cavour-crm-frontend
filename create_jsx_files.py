import os

os.makedirs("src/pages", exist_ok=True)

# Scouting.jsx
with open("src/pages/Scouting.jsx", "w", encoding="utf-8") as f:
    f.write('''import { useState, useEffect } from "react"
import { api, fmt } from "../api.js"

const TIPI = [{ value: "", label: "Tutti" }, { value: "privato", label: "Privati" }, { value: "multiagenzia", label: "Multi-agenzia" }, { value: "agenzia_singola", label: "Agenzia singola" }]
const STATI = [{ value: "nuovo", label: "Nuovi" }, { value: "contattato", label: "Contattati" }, { value: "risposto", label: "Risposto" }, { value: "", label: "Tutti" }]

function WAModal({ immobile, onClose, onSent }) {
  const [msg, setMsg] = useState(
    "Buongiorno" + (immobile.contatto_nome ? " " + immobile.contatto_nome : "") + ",\\n\\n" +
    "Sono Ilan Boni di Cavour Immobiliare.\\n" +
    "Ho visto il suo immobile" + (immobile.indirizzo ? " in " + immobile.indirizzo : "") + " e mi piacerebbe parlarne con lei.\\n\\n" +
    "Siamo un agenzia boutique che segue massimo 5 immobili alla volta.\\n\\n" +
    "E disponibile per una breve chiamata?\\n\\n" +
    "Ilan Boni\\nCavour Immobiliare - Via Statuto 10, Milano"
  )

  function send() {
    if (!immobile.contatto_telefono) { alert("Numero non disponibile"); return }
    const num = immobile.contatto_telefono.replace(/\\D/g, "")
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
      if (stato) params.stato_contatto = stato
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

  return (
    <div>
      {waModal && <WAModal immobile={waModal} onClose={() => setWaModal(null)} onSent={handleSent} />}
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div className="section-title" style={{ flex: 1, marginBottom: 0 }}>Scouting — {total} immobili</div>
      </div>
      <div className="tabs">
        {TIPI.map(t => <div key={t.value} className={"tab " + (tipo === t.value ? "active" : "")} onClick={() => setTipo(t.value)}>{t.label}</div>)}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {STATI.map(s => <button key={s.value} className={"btn btn-sm " + (stato === s.value ? "btn-gold" : "btn-ghost")} onClick={() => setStato(s.value)}>{s.label}</button>)}
      </div>
      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : list.length === 0 ? <div className="empty"><div className="empty-icon">*</div>Nessun immobile trovato</div>
          : list.map(p => (
            <div key={p.id} className="row-item">
              <div className={"row-avatar " + (tipoAvatar[p.tipo_fonte] || "avatar-gold")}>{(p.tipo_fonte||"P")[0].toUpperCase()}</div>
              <div className="row-body">
                <div className="row-title">{p.indirizzo || p.titolo}</div>
                <div className="row-sub">{[p.zona, p.mq ? p.mq+" mq" : "", p.contatto_nome, p.contatto_telefono].filter(Boolean).join(" - ")}</div>
              </div>
              <div className="row-end" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div className="row-price">{fmt(p.prezzo)}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <span className={"badge " + (tipoBadge[p.tipo_fonte] || "badge-gray")}>{tipoLabel[p.tipo_fonte] || p.tipo_fonte}</span>
                  {p.tipo_fonte === "privato" && p.stato_contatto === "nuovo" && (
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
''')

# Dashboard.jsx
with open("src/pages/Dashboard.jsx", "w", encoding="utf-8") as f:
    f.write('''import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api, fmt, fmtOra, fmtData } from "../api.js"

const OBJECTIVES = [
  "Contatta almeno 3 privati con messaggio personalizzato",
  "Follow-up clienti 4-5 stelle in scadenza",
  "Proponi almeno 1 immobile a un acquirente",
  "Verifica appuntamenti di oggi",
  "Aggiorna stato di almeno 2 immobili",
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ nClienti: 0, nImm: 0, nPrivati: 0, nMatching: 0 })
  const [privati, setPrivati] = useState([])
  const [multi, setMulti] = useState([])
  const [appt, setAppt] = useState([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(Array(OBJECTIVES.length).fill(false))
  const [coachMsg, setCoachMsg] = useState("")

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [c, i, ext, match, apptData, multiData] = await Promise.all([
        api.getClienti({ limit: 200 }),
        api.getImmobili({ limit: 50 }),
        api.getImmobiliEsterni({ tipo_fonte: "privato", stato_contatto: "nuovo", limit: 10 }),
        api.getMatching({ proposto: false, limit: 50 }),
        api.getAppuntamenti({ completato: false, limit: 5 }),
        api.getImmobiliEsterni({ tipo_fonte: "multiagenzia", limit: 5 }),
      ])
      const nPrivati = ext.total || (ext.data || []).length
      const nMatching = Array.isArray(match) ? match.length : 0
      const s = { nClienti: c.total || 0, nImm: (i.data || []).length, nPrivati, nMatching }
      setStats(s)
      setPrivati(ext.data || [])
      setAppt(Array.isArray(apptData) ? apptData : [])
      setMulti(multiData.data || [])
      const ora = new Date().getHours()
      const saluto = ora < 12 ? "Buongiorno" : ora < 18 ? "Buon pomeriggio" : "Buonasera"
      let msg = saluto + " Ilan. "
      if (nPrivati > 0) msg += "Hai " + nPrivati + " privati nuovi da contattare. "
      if (nMatching > 0) msg += nMatching + " matching pronti da proporre. "
      msg += "Ogni contatto rimandato oggi e un mandato perso domani."
      setCoachMsg(msg)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openWA(telefono, nome) {
    if (!telefono) { alert("Numero non disponibile"); return }
    const num = telefono.replace(/\\D/g, "")
    const msg = encodeURIComponent("Buongiorno" + (nome ? " " + nome : "") + ",\\nSono Ilan Boni di Cavour Immobiliare.\\nHo visto il suo immobile e mi piacerebbe parlarne con lei.\\n\\nIlan Boni\\nCavour Immobiliare - Via Statuto 10, Milano")
    window.open("https://wa.me/" + num + "?text=" + msg, "_blank")
  }

  const doneCount = done.filter(Boolean).length
  const pct = Math.round(doneCount / OBJECTIVES.length * 100)

  return (
    <div>
      <div className="coach-card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--black)", fontWeight: 600 }}>*</div>
          <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>Coach AI — Briefing del giorno</div>
        </div>
        <div className="coach-message">{loading ? "Analizzando i dati..." : coachMsg}</div>
        <div style={{ marginBottom: "1.25rem" }}>
          {OBJECTIVES.map((obj, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", opacity: done[i] ? 0.5 : 1 }}>
              <div onClick={() => { const n = [...done]; n[i] = !n[i]; setDone(n) }} style={{ width: 18, height: 18, borderRadius: "50%", border: done[i] ? "none" : "1.5px solid var(--gold-border-strong)", background: done[i] ? "var(--gold)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 10, color: "var(--black)", fontWeight: 700 }}>
                {done[i] ? "v" : ""}
              </div>
              <span style={{ fontSize: 12, color: "var(--white-dim)", textDecoration: done[i] ? "line-through" : "none" }}>{obj}</span>
            </div>
          ))}
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: pct + "%" }} /></div>
        <div style={{ fontSize: 11, color: "var(--white-muted)", marginTop: "0.35rem" }}>{doneCount} / {OBJECTIVES.length} obiettivi completati</div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Clienti attivi</div><div className="stat-value gold">{loading ? "—" : stats.nClienti}</div><div className="stat-delta">totale</div></div>
        <div className="stat-card"><div className="stat-label">Mandati attivi</div><div className="stat-value">{loading ? "—" : stats.nImm}</div><div className="stat-delta">in gestione</div></div>
        <div className="stat-card"><div className="stat-label">Privati oggi</div><div className="stat-value gold">{loading ? "—" : stats.nPrivati}</div><div className="stat-delta up">da contattare</div></div>
        <div className="stat-card"><div className="stat-label">Matching</div><div className="stat-value">{loading ? "—" : stats.nMatching}</div><div className="stat-delta">da proporre</div></div>
      </div>

      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        <div>
          <div className="section-title">Privati — contatta subito</div>
          <div className="card">
            {loading ? <div className="loading">Caricamento...</div>
              : privati.length === 0 ? <div className="empty">Nessun privato nuovo</div>
              : privati.map(p => (
                <div key={p.id} className="row-item" onClick={() => navigate("/scouting")}>
                  <div className="row-avatar avatar-red">P</div>
                  <div className="row-body">
                    <div className="row-title">{p.indirizzo || p.titolo}</div>
                    <div className="row-sub">{[p.zona, p.mq ? p.mq+" mq" : "", p.contatto_nome].filter(Boolean).join(" - ")}</div>
                  </div>
                  <div className="row-end">
                    <div className="row-price">{fmt(p.prezzo)}</div>
                    <button className="btn btn-wa" style={{ marginTop: 4 }} onClick={e => { e.stopPropagation(); openWA(p.contatto_telefono, p.contatto_nome) }}>WA</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div>
          <div className="section-title">Follow-up urgenti</div>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div className="row-item"><div className="row-avatar avatar-gold">*</div><div className="row-body"><div className="row-title">Sig.ra D Amato</div><div className="row-sub">Non contattata da 5 giorni</div></div><div className="row-end"><span className="stars">*****</span><button className="btn btn-wa" style={{ marginTop: 4 }} onClick={() => openWA("+393351321986", "D Amato")}>WA</button></div></div>
            <div className="row-item"><div className="row-avatar avatar-gold">*</div><div className="row-body"><div className="row-title">Sig. Troina</div><div className="row-sub">Non contattato da 7 giorni</div></div><div className="row-end"><span className="stars">****</span><button className="btn btn-wa" style={{ marginTop: 4 }} onClick={() => openWA("+393471027019", "Troina")}>WA</button></div></div>
            <div className="row-item"><div className="row-avatar avatar-gold">*</div><div className="row-body"><div className="row-title">Yael Rosenholz</div><div className="row-sub">Non contattata da 3 giorni</div></div><div className="row-end"><span className="stars">*****</span><button className="btn btn-wa" style={{ marginTop: 4 }} onClick={() => openWA("+393899244145", "Yael")}>WA</button></div></div>
          </div>
          <div className="section-title">Appuntamenti oggi</div>
          <div className="card">
            {appt.length === 0 ? <div className="empty">Nessun appuntamento oggi</div>
              : appt.map(a => (
                <div key={a.id} className="row-item">
                  <div className="row-avatar avatar-blue">C</div>
                  <div className="row-body"><div className="row-title">{a.cliente_nome||""} {a.cliente_cognome||""}</div><div className="row-sub">{a.luogo||""} - {a.tipo||"visita"}</div></div>
                  <div className="row-end"><div className="row-price" style={{ fontSize: 12 }}>{fmtOra(a.data_ora)}</div><span className={"badge " + (a.confermato ? "badge-green" : "badge-gray")}>{a.confermato ? "confermato" : "da confermare"}</span></div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="section-title">Multi-agenzia — opportunita mandato</div>
      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : multi.length === 0 ? <div className="empty">Nessun immobile multi-agenzia</div>
          : multi.map(p => (
            <div key={p.id} className="row-item" onClick={() => navigate("/scouting")}>
              <div className="row-avatar avatar-gold">M</div>
              <div className="row-body"><div className="row-title">{p.indirizzo || p.titolo}</div><div className="row-sub">{[p.zona, p.mq ? p.mq+" mq" : ""].filter(Boolean).join(" - ")}</div></div>
              <div className="row-end"><div className="row-price">{fmt(p.prezzo)}</div><span className="badge badge-gold">Mandato</span></div>
            </div>
          ))}
      </div>
    </div>
  )
}
''')

# ClienteDetail.jsx
with open("src/pages/ClienteDetail.jsx", "w", encoding="utf-8") as f:
    f.write('''import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api, fmt, fmtData, fmtOra } from "../api.js"

export default function ClienteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [tab, setTab] = useState("comunicazioni")
  const [comms, setComms] = useState([])
  const [appts, setAppts] = useState([])
  const [docs, setDocs] = useState([])
  const [richieste, setRichieste] = useState([])
  const [loading, setLoading] = useState(true)
  const [testo, setTesto] = useState("")
  const [tipo, setTipo] = useState("nota")
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadCliente() }, [id])
  useEffect(() => {
    if (tab === "comunicazioni") loadComms()
    if (tab === "appuntamenti") loadAppts()
    if (tab === "documenti") loadDocs()
    if (tab === "richieste") loadRichieste()
  }, [tab, id])

  async function loadCliente() { setLoading(true); try { setCliente(await api.getCliente(id)); loadComms() } catch {} setLoading(false) }
  async function loadComms() { try { setComms(await api.getComunicazioniCliente(id)) } catch {} }
  async function loadAppts() { try { setAppts(await api.getAppuntamentiCliente(id)) } catch {} }
  async function loadDocs() { try { setDocs(await api.getDocumentiCliente(id)) } catch {} }
  async function loadRichieste() { try { setRichieste(await api.getRichiesteCliente(id)) } catch {} }

  async function saveComunicazione(e) {
    e.preventDefault()
    if (!testo.trim()) return
    setSaving(true)
    try { await api.creaComunicazione({ cliente_id: Number(id), testo, tipo, canale: "manuale" }); setTesto(""); loadComms() } catch {}
    setSaving(false)
  }

  if (loading) return <div className="loading">Caricamento...</div>
  if (!cliente) return <div className="empty">Cliente non trovato</div>

  const nome = [cliente.appellativo, cliente.nome, cliente.cognome].filter(Boolean).join(" ")
  const ruoloBadge = { acquirente: "badge-green", venditore: "badge-gold", acquirente_venditore: "badge-blue", contatto: "badge-gray" }
  const ruoloLabel = { acquirente: "Acquirente", venditore: "Venditore", acquirente_venditore: "Acq/Vend", contatto: "Lead" }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/clienti")} style={{ marginBottom: "1rem" }}>Torna ai clienti</button>
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--gold-bg)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600 }}>
                {(cliente.nome || cliente.cognome || "?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--white)", marginBottom: 4 }}>{nome || "Cliente senza nome"}</div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span className={"badge " + (ruoloBadge[cliente.ruolo] || "badge-gray")}>{ruoloLabel[cliente.ruolo] || cliente.ruolo}</span>
                  <span className="stars">{"*".repeat(cliente.rating||3)}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {cliente.telefono && <button className="btn btn-wa" onClick={() => window.open("https://wa.me/" + cliente.telefono.replace(/\\D/g,""), "_blank")}>WhatsApp</button>}
              <button className="btn btn-outline btn-sm">Modifica</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginTop: "1.25rem", borderTop: "1px solid var(--gold-border)", paddingTop: "1rem" }}>
            {[["Telefono", cliente.telefono], ["Email", cliente.email], ["Compleanno", cliente.compleanno], ["Religione", cliente.religione], ["Fonte", cliente.fonte_acquisizione], ["Stato", cliente.stato_trattativa]].filter(f => f[1]).map(f => (
              <div key={f[0]}><div style={{ fontSize: 10, color: "var(--white-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{f[0]}</div><div style={{ fontSize: 13, color: "var(--white-dim)" }}>{f[1]}</div></div>
            ))}
          </div>
          {cliente.note && <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--dark-3)", borderRadius: 8 }}><div style={{ fontSize: 10, color: "var(--white-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Note</div><div style={{ fontSize: 12, color: "var(--white-dim)", lineHeight: 1.6 }}>{cliente.note}</div></div>}
        </div>
      </div>

      <div className="tabs">
        {["comunicazioni","appuntamenti","documenti","richieste"].map(t => (
          <div key={t} className={"tab " + (tab === t ? "active" : "")} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>
        ))}
      </div>

      <div className="card">
        {tab === "comunicazioni" && (
          <>
            {comms.length === 0 ? <div className="empty">Nessuna comunicazione</div>
              : comms.map(c => (
                <div key={c.id} style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.3rem", alignItems: "center" }}>
                    <span className="badge badge-gray">{c.tipo}</span>
                    {c.immobile_titolo && <span style={{ fontSize: 11, color: "var(--gold)" }}>{c.immobile_titolo}</span>}
                    <span style={{ fontSize: 11, color: "var(--white-muted)", marginLeft: "auto" }}>{fmtData(c.data_ora)} {fmtOra(c.data_ora)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--white-dim)", lineHeight: 1.5 }}>{c.testo}</div>
                </div>
              ))}
            <form onSubmit={saveComunicazione} style={{ padding: "1rem", borderTop: "1px solid var(--gold-border)" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {["nota","chiamata","whatsapp","email"].map(t => (
                  <button key={t} type="button" className={"btn btn-sm " + (tipo === t ? "btn-gold" : "btn-ghost")} onClick={() => setTipo(t)}>{t}</button>
                ))}
              </div>
              <textarea className="input" rows={2} placeholder="Aggiungi nota..." value={testo} onChange={e => setTesto(e.target.value)} style={{ resize: "vertical", marginBottom: "0.5rem" }} />
              <button type="submit" className="btn btn-gold btn-sm" disabled={saving}>{saving ? "Salvo..." : "Salva"}</button>
            </form>
          </>
        )}
        {tab === "appuntamenti" && (
          appts.length === 0 ? <div className="empty">Nessun appuntamento</div>
            : appts.map(a => (
              <div key={a.id} className="row-item">
                <div className="row-avatar avatar-blue">C</div>
                <div className="row-body"><div className="row-title">{a.tipo||"Visita"} — {a.luogo||"—"}</div><div className="row-sub">{a.immobile_titolo||""}</div></div>
                <div className="row-end"><div className="row-price" style={{ fontSize: 12 }}>{fmtData(a.data_ora)} {fmtOra(a.data_ora)}</div><span className={"badge " + (a.completato ? "badge-gray" : a.confermato ? "badge-green" : "badge-gold")}>{a.completato ? "completato" : a.confermato ? "confermato" : "da confermare"}</span></div>
              </div>
            ))
        )}
        {tab === "documenti" && (
          docs.length === 0 ? <div className="empty">Nessun documento</div>
            : docs.map(d => (
              <div key={d.id} className="row-item">
                <div className="row-avatar avatar-gold">D</div>
                <div className="row-body"><div className="row-title">{d.nome}</div><div className="row-sub">{d.tipo}</div></div>
                <div className="row-end">{d.url && <a href={d.url} target="_blank" rel="noopener" className="btn btn-outline btn-sm">Apri</a>}</div>
              </div>
            ))
        )}
        {tab === "richieste" && (
          richieste.length === 0 ? <div className="empty">Nessuna richiesta</div>
            : richieste.map(r => (
              <div key={r.id} className="row-item">
                <div className="row-avatar avatar-green">R</div>
                <div className="row-body"><div className="row-title">{r.zona||"Qualsiasi zona"} - {r.budget_massimo ? fmt(r.budget_massimo) : "—"}</div><div className="row-sub">{[r.mq_minimi ? "min "+r.mq_minimi+" mq" : "", r.camere_minime ? r.camere_minime+" cam" : ""].filter(Boolean).join(" - ")}</div></div>
                <div className="row-end"><span className={"badge " + (r.attiva ? "badge-green" : "badge-gray")}>{r.attiva ? "attiva" : "inattiva"}</span></div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
''')

# ImmobileDetail.jsx
with open("src/pages/ImmobileDetail.jsx", "w", encoding="utf-8") as f:
    f.write('''import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api, fmt, fmtData, fmtOra } from "../api.js"

export default function ImmobileDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [immobile, setImmobile] = useState(null)
  const [tab, setTab] = useState("comunicazioni")
  const [comms, setComms] = useState([])
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [testo, setTesto] = useState("")
  const [tipo, setTipo] = useState("nota")
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadImmobile() }, [id])
  useEffect(() => {
    if (tab === "comunicazioni") loadComms()
    if (tab === "appuntamenti") loadAppts()
  }, [tab, id])

  async function loadImmobile() { setLoading(true); try { setImmobile(await api.getImmobile(id)); loadComms() } catch {} setLoading(false) }
  async function loadComms() { try { setComms(await api.getComunicazioniImmobile(id)) } catch {} }
  async function loadAppts() { try { setAppts(await api.getAppuntamentiImmobile(id)) } catch {} }

  async function saveComunicazione(e) {
    e.preventDefault()
    if (!testo.trim()) return
    setSaving(true)
    try { await api.creaComunicazione({ immobile_id: Number(id), testo, tipo, canale: "manuale" }); setTesto(""); loadComms() } catch {}
    setSaving(false)
  }

  if (loading) return <div className="loading">Caricamento...</div>
  if (!immobile) return <div className="empty">Immobile non trovato</div>

  const statiBadge = { disponibile: "badge-green", proposta: "badge-gold", compromesso: "badge-blue", rogitato: "badge-gray", ritirato: "badge-gray" }
  const car = [
    ["Superficie", immobile.mq ? immobile.mq+" mq" : null],
    ["Piano", immobile.piano],
    ["Camere", immobile.camere],
    ["Bagni", immobile.bagni],
    ["Ascensore", immobile.ascensore ? "Si" : null],
    ["Balcone", immobile.balcone ? "Si" : null],
    ["Terrazzo", immobile.terrazzo ? "Si" : null],
    ["Box", immobile.box ? "Si" : null],
    ["Classe en.", immobile.classe_energetica],
  ].filter(c => c[1])

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/immobili")} style={{ marginBottom: "1rem" }}>Torna agli immobili</button>
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--white)", marginBottom: 6 }}>{immobile.indirizzo || immobile.titolo}</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className={"badge " + (statiBadge[immobile.stato_vendita] || "badge-gray")}>{immobile.stato_vendita}</span>
                <span className="badge badge-gray">{immobile.tipo_contratto}</span>
                {immobile.zona && <span style={{ fontSize: 12, color: "var(--white-muted)" }}>{immobile.zona}</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--gold)", fontWeight: 600 }}>{fmt(immobile.prezzo)}</div>
              {immobile.mq && <div style={{ fontSize: 12, color: "var(--white-muted)" }}>{immobile.mq} mq</div>}
            </div>
          </div>
          {immobile.proprietario_nome && (
            <div style={{ padding: "0.75rem", background: "var(--gold-bg)", borderRadius: 8, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Proprietario</div>
                <div style={{ fontSize: 13, color: "var(--white)" }}>{immobile.proprietario_nome} {immobile.proprietario_cognome||""}</div>
              </div>
              {immobile.proprietario_telefono && <button className="btn btn-wa" onClick={() => window.open("https://wa.me/" + immobile.proprietario_telefono.replace(/\\D/g,""), "_blank")}>WA</button>}
            </div>
          )}
          {car.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" }}>
              {car.map(c => (
                <div key={c[0]} style={{ background: "var(--dark-3)", borderRadius: 6, padding: "0.5rem 0.75rem" }}>
                  <div style={{ fontSize: 10, color: "var(--white-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{c[0]}</div>
                  <div style={{ fontSize: 13, color: "var(--white-dim)", fontWeight: 500 }}>{c[1]}</div>
                </div>
              ))}
            </div>
          )}
          {immobile.note_interne && <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--dark-3)", borderRadius: 8 }}><div style={{ fontSize: 10, color: "var(--white-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Note interne</div><div style={{ fontSize: 12, color: "var(--white-dim)", lineHeight: 1.6 }}>{immobile.note_interne}</div></div>}
        </div>
      </div>

      <div className="tabs">
        {["comunicazioni","appuntamenti"].map(t => (
          <div key={t} className={"tab " + (tab === t ? "active" : "")} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>
        ))}
      </div>

      <div className="card">
        {tab === "comunicazioni" && (
          <>
            {comms.length === 0 ? <div className="empty">Nessuna comunicazione</div>
              : comms.map(c => (
                <div key={c.id} style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.3rem", alignItems: "center" }}>
                    <span className="badge badge-gray">{c.tipo}</span>
                    {c.cliente_nome && <span style={{ fontSize: 11, color: "var(--gold)" }}>{c.cliente_nome} {c.cliente_cognome||""}</span>}
                    <span style={{ fontSize: 11, color: "var(--white-muted)", marginLeft: "auto" }}>{fmtData(c.data_ora)} {fmtOra(c.data_ora)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--white-dim)", lineHeight: 1.5 }}>{c.testo}</div>
                </div>
              ))}
            <form onSubmit={saveComunicazione} style={{ padding: "1rem", borderTop: "1px solid var(--gold-border)" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {["nota","chiamata","whatsapp","email"].map(t => (
                  <button key={t} type="button" className={"btn btn-sm " + (tipo === t ? "btn-gold" : "btn-ghost")} onClick={() => setTipo(t)}>{t}</button>
                ))}
              </div>
              <textarea className="input" rows={2} placeholder="Aggiungi nota..." value={testo} onChange={e => setTesto(e.target.value)} style={{ resize: "vertical", marginBottom: "0.5rem" }} />
              <button type="submit" className="btn btn-gold btn-sm" disabled={saving}>{saving ? "Salvo..." : "Salva"}</button>
            </form>
          </>
        )}
        {tab === "appuntamenti" && (
          appts.length === 0 ? <div className="empty">Nessun appuntamento</div>
            : appts.map(a => (
              <div key={a.id} className="row-item">
                <div className="row-avatar avatar-blue">C</div>
                <div className="row-body"><div className="row-title">{a.cliente_nome||""} {a.cliente_cognome||""}</div><div className="row-sub">{a.luogo||""} - {a.tipo||"visita"}</div></div>
                <div className="row-end"><div className="row-price" style={{ fontSize: 12 }}>{fmtData(a.data_ora)} {fmtOra(a.data_ora)}</div></div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
''')

print("Tutti i file creati!")
