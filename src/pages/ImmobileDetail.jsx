import { useState, useEffect } from "react"
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
              {immobile.proprietario_telefono && <button className="btn btn-wa" onClick={() => window.open("https://wa.me/" + immobile.proprietario_telefono.replace(/\D/g,""), "_blank")}>WA</button>}
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
