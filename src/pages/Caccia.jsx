import { useState, useEffect, useRef } from "react"
import { api, fmt } from "../api.js"

const FASI = [
  { value: "da_lavorare", label: "Da lavorare" },
  { value: "ricerca_contatti", label: "Ricerca contatti" },
  { value: "visura_richiesta", label: "Visura richiesta" },
  { value: "contattato", label: "Contattato" },
  { value: "appuntamento_fissato", label: "Appuntamento" },
  { value: "mandato_preso", label: "Mandato preso" },
  { value: "perso", label: "Perso" },
]
const FASI_APERTE = ["ricerca_contatti", "visura_richiesta", "contattato", "appuntamento_fissato"]
const etichettaFase = (v) => (FASI.find(f => f.value === v) || {}).label || v

function coloreP(p) {
  if (p >= 75) return "#d4574a"
  if (p >= 60) return "#96751f"
  if (p >= 45) return "#8a8a5a"
  return "#5a5a5a"
}

function Punteggio({ valore }) {
  return (
    <div style={{
      minWidth: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 15, fontWeight: 500, color: "#fff",
      background: coloreP(valore), fontFamily: "var(--font-display)"
    }}>{valore}</div>
  )
}

function Scarto({ pct }) {
  if (pct === null || pct === undefined) return <span className="badge badge-gray">n/d</span>
  const sopra = pct > 5, sotto = pct < -5
  return (
    <span className={"badge " + (sopra ? "badge-red" : sotto ? "badge-green" : "badge-gray")}>
      {pct > 0 ? "+" : ""}{pct}% sul mercato
    </span>
  )
}

function Mappa({ lista, onPick }) {
  const box = useRef(null)
  const mappa = useRef(null)
  const strato = useRef(null)

  useEffect(() => {
    if (!window.L || !box.current) return
    if (!mappa.current) {
      mappa.current = window.L.map(box.current).setView([45.4722, 9.1700], 13)
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap, &copy; CARTO", maxZoom: 19
      }).addTo(mappa.current)
    }
    if (strato.current) strato.current.remove()
    strato.current = window.L.layerGroup().addTo(mappa.current)
    const punti = []
    lista.forEach(im => {
      if (!im.latitudine || !im.longitudine) return
      const p = [Number(im.latitudine), Number(im.longitudine)]
      punti.push(p)
      const m = window.L.circleMarker(p, {
        radius: 6 + Math.round(im.punteggio / 18),
        color: coloreP(im.punteggio), fillColor: coloreP(im.punteggio),
        fillOpacity: 0.75, weight: 1
      }).addTo(strato.current)
      m.bindTooltip(
        `<b>${im.indirizzo || "senza indirizzo"}</b><br>${im.zona || ""}<br>` +
        `${im.mq ? im.mq + " mq · " : ""}${im.prezzo ? Number(im.prezzo).toLocaleString("it-IT") + " €" : ""}<br>` +
        `${im.num_agenzie} agenzie · punti ${im.punteggio}`
      )
      m.on("click", () => onPick(im))
    })
    if (punti.length) mappa.current.fitBounds(punti, { padding: [30, 30], maxZoom: 15 })
  }, [lista])

  return <div ref={box} style={{ height: 460, borderRadius: 14, overflow: "hidden", border: "1px solid var(--gold-border)" }} />
}

function Dettaglio({ id, onClose, onCambiato }) {
  const [d, setD] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState("")
  const [prop, setProp] = useState({})

  useEffect(() => {
    api.getCacciaDettaglio(id).then(r => {
      setD(r)
      setProp({
        proprietario_nome: r.immobile.proprietario_nome || "",
        proprietario_cognome: r.immobile.proprietario_cognome || "",
        proprietario_telefono: r.immobile.proprietario_telefono || "",
      })
    }).catch(e => setErrore(String(e)))
  }, [id])

  async function salva(patch) {
    setSalvando(true); setErrore("")
    try {
      await api.aggiornaCaccia(id, patch)
      const r = await api.getCacciaDettaglio(id)
      setD(r); onCambiato && onCambiato()
    } catch (e) { setErrore(e.message || String(e)) }
    setSalvando(false)
  }

  const im = d && d.immobile
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--dark-2)", borderLeft: "1px solid var(--gold-border)", width: "100%", maxWidth: 520, overflowY: "auto", padding: "1.25rem" }}>
        {!im ? <div className="loading">Caricamento...</div> : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--white)" }}>
                  {im.indirizzo || "Senza indirizzo"}
                </div>
                <div className="row-sub">{[im.zona, im.mq ? im.mq + " mq" : null, im.locali ? im.locali + " locali" : null].filter(Boolean).join(" · ")}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>X</button>
            </div>

            <div style={{ display: "flex", gap: 10, margin: "1rem 0", alignItems: "center" }}>
              <Punteggio valore={im.punteggio} />
              <div style={{ fontSize: 12, color: "var(--white-muted)" }}>acquisizione</div>
              <Punteggio valore={im.punteggio_affare} />
              <div style={{ fontSize: 12, color: "var(--white-muted)" }}>affare</div>
            </div>

            <div className="card" style={{ padding: "0.9rem", marginBottom: "1rem", fontSize: 13, lineHeight: 1.9 }}>
              <div><b>{fmt(im.prezzo)}</b>{im.eur_mq ? ` · ${Number(im.eur_mq).toLocaleString("it-IT")} €/mq` : ""}</div>
              <div>Mediana zona: {im.mediana_zona ? Number(im.mediana_zona).toLocaleString("it-IT") + " €/mq" : "campione troppo piccolo"} {im.campione_zona ? `(${im.campione_zona} confronti)` : ""}</div>
              <div><Scarto pct={im.scarto_pct} /></div>
              <div>{im.num_agenzie} agenzie: {(im.lista_agenzie || []).join(", ") || "—"}</div>
              <div>In archivio da {im.giorni_in_archivio} giorni · primo avvistamento {new Date(im.primo_visto).toLocaleDateString("it-IT")}</div>
              {im.doppio_vendita_affitto && <div className="badge badge-gold">Stesso immobile in vendita e in affitto</div>}
              {im.clienti_interessati > 0 && <div style={{ color: "var(--gold)" }}>{im.clienti_interessati} clienti in cerca: {im.nomi_clienti}</div>}
            </div>

            {d.stessa_via.length > 0 && (
              <div className="card" style={{ padding: "0.9rem", marginBottom: "1rem", fontSize: 12 }}>
                <div className="nav-section-label">Stessa via, in archivio</div>
                {d.stessa_via.map(s => (
                  <div key={s.id} style={{ padding: "4px 0", color: "var(--white-muted)" }}>
                    {s.mq || "?"} mq · {s.e_affitto ? "affitto" : "vendita"} · {fmt(s.prezzo)} · {new Date(s.primo_visto).toLocaleDateString("it-IT")}
                  </div>
                ))}
              </div>
            )}

            <div className="nav-section-label">Fase</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
              {FASI.map(f => (
                <button key={f.value} disabled={salvando}
                  className={"btn btn-sm " + (im.fase === f.value ? "btn-gold" : "btn-ghost")}
                  onClick={() => salva({ fase: f.value })}>{f.label}</button>
              ))}
            </div>
            {errore && <div className="badge badge-red" style={{ display: "block", marginBottom: "1rem", padding: "0.6rem" }}>{errore}</div>}

            <div className="nav-section-label">Proprietario</div>
            <div style={{ display: "grid", gap: 6, marginBottom: "0.75rem" }}>
              <input className="input" placeholder="Nome" value={prop.proprietario_nome} onChange={e => setProp({ ...prop, proprietario_nome: e.target.value })} />
              <input className="input" placeholder="Cognome" value={prop.proprietario_cognome} onChange={e => setProp({ ...prop, proprietario_cognome: e.target.value })} />
              <input className="input" placeholder="Telefono" value={prop.proprietario_telefono} onChange={e => setProp({ ...prop, proprietario_telefono: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
              <button className="btn btn-gold btn-sm" disabled={salvando} onClick={() => salva(prop)}>Salva proprietario</button>
              {prop.proprietario_telefono && (
                <a className="btn btn-wa btn-sm" target="_blank" rel="noreferrer"
                   href={"https://wa.me/" + prop.proprietario_telefono.replace(/\D/g, "")}>WhatsApp</a>
              )}
              {im.latitudine && (
                <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer"
                   href={`https://www.google.com/maps/search/?api=1&query=${im.latitudine},${im.longitudine}`}>Mappa</a>
              )}
            </div>

            {(im.listing_urls || []).length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div className="nav-section-label">Annunci</div>
                {(im.listing_urls || []).map((u, k) => (
                  <div key={k}><a href={u} target="_blank" rel="noreferrer" style={{ color: "var(--gold)", fontSize: 12 }}>{u}</a></div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Caccia() {
  const [lista, setLista] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordina, setOrdina] = useState("acquisizione")
  const [tipo, setTipo] = useState("vendita")
  const [fase, setFase] = useState("")
  const [search, setSearch] = useState("")
  const [soloClienti, setSoloClienti] = useState(false)
  const [soloDoppi, setSoloDoppi] = useState(false)
  const [mappaAperta, setMappaAperta] = useState(false)
  const [dettaglio, setDettaglio] = useState(null)

  useEffect(() => { carica() }, [ordina, tipo, fase, soloClienti, soloDoppi])
  useEffect(() => { const t = setTimeout(carica, 400); return () => clearTimeout(t) }, [search])

  async function carica() {
    setLoading(true)
    try {
      const params = { ordina, limit: 150 }
      if (tipo) params.tipo = tipo
      if (fase) params.fase = fase
      if (search) params.search = search
      if (soloClienti) params.solo_con_clienti = true
      if (soloDoppi) params.solo_doppi = true
      const [d, s] = await Promise.all([api.getCaccia(params), api.getCacciaStats()])
      setLista(d.data || []); setTotal(d.total || 0); setStats(s)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const pieno = stats && stats.in_caccia >= stats.tetto

  return (
    <div>
      {dettaglio && <Dettaglio id={dettaglio} onClose={() => setDettaglio(null)} onCambiato={carica} />}

      <div className="section-header" style={{ marginBottom: "0.75rem" }}>
        <div className="section-title" style={{ flex: 1, marginBottom: 0 }}>Caccia — {total} immobili</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setMappaAperta(!mappaAperta)}>
          {mappaAperta ? "Nascondi mappa" : "Mostra mappa"}
        </button>
      </div>

      {stats && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem", fontSize: 12 }}>
          <span className={"badge " + (pieno ? "badge-red" : "badge-gold")}>
            In caccia {stats.in_caccia}/{stats.tetto}
          </span>
          <span className="badge badge-gray">{stats.alta_priorita} sopra 70 punti</span>
          <span className="badge badge-green">{stats.con_clienti} con clienti in cerca</span>
          <span className="badge badge-gray">{stats.doppi} in vendita e affitto insieme</span>
        </div>
      )}
      {pieno && (
        <div className="card" style={{ padding: "0.75rem", marginBottom: "1rem", fontSize: 12, color: "var(--white-muted)" }}>
          Hai raggiunto il tetto: per aprirne un altro devi chiuderne uno. È la regola che impedisce
          alla coda di tornare come prima — milleduecento aperte e nessuna lavorata.
        </div>
      )}

      <div className="tabs">
        <div className={"tab " + (ordina === "acquisizione" ? "active" : "")} onClick={() => setOrdina("acquisizione")}>Da acquisire</div>
        <div className={"tab " + (ordina === "affare" ? "active" : "")} onClick={() => setOrdina("affare")}>Affari per i clienti</div>
        <div className={"tab " + (ordina === "recenti" ? "active" : "")} onClick={() => setOrdina("recenti")}>Appena trovati</div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "0.75rem 0 1rem" }}>
        <input className="input" placeholder="Cerca via o zona" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
        <button className={"btn btn-sm " + (tipo === "vendita" ? "btn-gold" : "btn-ghost")} onClick={() => setTipo("vendita")}>Vendita</button>
        <button className={"btn btn-sm " + (tipo === "affitto" ? "btn-gold" : "btn-ghost")} onClick={() => setTipo("affitto")}>Affitto</button>
        <button className={"btn btn-sm " + (tipo === "" ? "btn-gold" : "btn-ghost")} onClick={() => setTipo("")}>Tutti</button>
        <button className={"btn btn-sm " + (soloClienti ? "btn-gold" : "btn-ghost")} onClick={() => setSoloClienti(!soloClienti)}>Con clienti</button>
        <button className={"btn btn-sm " + (soloDoppi ? "btn-gold" : "btn-ghost")} onClick={() => setSoloDoppi(!soloDoppi)}>Vendita+affitto</button>
        <select className="input" value={fase} onChange={e => setFase(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Tutte le fasi</option>
          {FASI.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {mappaAperta && (
        <div style={{ marginBottom: "1rem" }}>
          <Mappa lista={lista} onPick={im => setDettaglio(im.id)} />
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading">Caricamento...</div>
          : lista.length === 0 ? <div className="empty"><div className="empty-icon">*</div>Nessun immobile</div>
          : lista.map(im => (
            <div key={im.id} className="row-item" style={{ cursor: "pointer" }} onClick={() => setDettaglio(im.id)}>
              <Punteggio valore={ordina === "affare" ? im.punteggio_affare : im.punteggio} />
              <div className="row-body">
                <div className="row-title">{im.indirizzo || "Senza indirizzo"}</div>
                <div className="row-sub">
                  {[im.zona, im.mq ? im.mq + " mq" : null, im.num_agenzie + " agenzie",
                    im.giorni_in_archivio + "gg"].filter(Boolean).join(" · ")}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                  <Scarto pct={im.scarto_pct} />
                  {im.clienti_interessati > 0 && <span className="badge badge-green">{im.clienti_interessati} clienti</span>}
                  {im.doppio_vendita_affitto && <span className="badge badge-gold">vendita+affitto</span>}
                  {im.fase !== "da_lavorare" && <span className="badge badge-gray">{etichettaFase(im.fase)}</span>}
                </div>
              </div>
              <div className="row-end" style={{ textAlign: "right" }}>
                <div className="row-price">{fmt(im.prezzo)}</div>
                <div style={{ fontSize: 11, color: "var(--white-muted)" }}>
                  {im.eur_mq ? Number(im.eur_mq).toLocaleString("it-IT") + " €/mq" : ""}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
