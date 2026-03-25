import { useState, useEffect } from "react"
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
              {cliente.telefono && <button className="btn btn-wa" onClick={() => window.open("https://wa.me/" + cliente.telefono.replace(/\D/g,""), "_blank")}>WhatsApp</button>}
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
