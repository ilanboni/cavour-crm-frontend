const API_BASE = import.meta.env.VITE_API_URL || "https://web-production-f9d5d.up.railway.app"

// ─────────────────────────────────────────────────────────────────────────────
// Stato del database, per la fascia in cima al CRM.
//
// Il 18 novembre 2026 Supabase e' stato irraggiungibile per due ore e il CRM
// mostrava schermate vuote: non si capiva se un cliente non avesse appuntamenti
// o se fosse il database a non rispondere. Il backend ora risponde ai GET con
// l'ultima copia buona piu' le intestazioni X-Degradato e X-Dati-Vecchi
// (vedi app/resilienza.py). Qui le leggiamo e lo diciamo a chi guarda.
// ─────────────────────────────────────────────────────────────────────────────
let statoDb = { degradato: false, datiVecchiIso: null }
let ultimoDegradato = 0
const ascoltatoriDb = new Set()

function segnalaStatoDb(degradato, datiVecchiIso) {
  if (degradato) {
    ultimoDegradato = Date.now()
  } else if (Date.now() - ultimoDegradato < 10000) {
    // Una pagina fa piu' chiamate: se una e' degradata e la successiva no, la
    // fascia non deve lampeggiare. Si spegne solo dopo dieci secondi puliti.
    return
  }
  const prima = statoDb
  statoDb = { degradato, datiVecchiIso: degradato ? datiVecchiIso : null }
  if (prima.degradato === statoDb.degradato && prima.datiVecchiIso === statoDb.datiVecchiIso) return
  ascoltatoriDb.forEach(fn => { try { fn(statoDb) } catch (e) { console.error(e) } })
}

export function osservaStatoDb(fn) {
  ascoltatoriDb.add(fn)
  fn(statoDb)
  return () => ascoltatoriDb.delete(fn)
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  })

  if (!res.ok) {
    // 503 e' il backend che dice "il database non risponde e non ho una copia".
    // Va distinto da un errore nostro: il messaggio e' in italiano e si mostra.
    if (res.status === 503) {
      let corpo = null
      try { corpo = await res.json() } catch (e) { /* corpo non JSON */ }
      segnalaStatoDb(true, null)
      const err = new Error(corpo?.messaggio || "Il database non risponde. Riprova fra qualche minuto.")
      err.databaseGiu = true
      throw err
    }
    throw new Error(`API error ${res.status}: ${path}`)
  }

  segnalaStatoDb(res.headers.get("X-Degradato") === "1", res.headers.get("X-Dati-Vecchi"))

  // Una 204 non ha corpo: res.json() lancerebbe e una cancellazione riuscita
  // sembrerebbe fallita.
  if (res.status === 204 || res.headers.get("content-length") === "0") return null
  return res.json()
}

export const api = {
  getClienti: (params = {}) => request(`/api/clienti?${new URLSearchParams({ limit: 100, ...params })}`),
  getCliente: (id) => request(`/api/clienti/${id}`),
  getComunicazioniCliente: (id) => request(`/api/clienti/${id}/comunicazioni`),
  getAppuntamentiCliente: (id) => request(`/api/clienti/${id}/appuntamenti`),
  getDocumentiCliente: (id) => request(`/api/clienti/${id}/documenti`),
  getRichiesteCliente: (id) => request(`/api/clienti/${id}/richieste`),
  getMatchingEsterni: (id) => request(`/api/clienti/${id}/matching-esterni`),
  creaCliente: (data) => request("/api/clienti", { method: "POST", body: JSON.stringify(data) }),
  aggiornaCliente: (id, data) => request(`/api/clienti/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getImmobili: (params = {}) => request(`/api/immobili?${new URLSearchParams({ limit: 50, ...params })}`),
  getImmobile: (id) => request(`/api/immobili/${id}`),
  getComunicazioniImmobile: (id) => request(`/api/immobili/${id}/comunicazioni`),
  getAppuntamentiImmobile: (id) => request(`/api/immobili/${id}/appuntamenti`),
  creaImmobile: (data) => request("/api/immobili", { method: "POST", body: JSON.stringify(data) }),
  aggiornaImmobile: (id, data) => request(`/api/immobili/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getImmobiliEsterni: (params = {}) => request(`/api/immobili-esterni?${new URLSearchParams({ limit: 100, ...params })}`),
  getPrivati: () => request("/api/immobili-esterni/privati"),
  getMultiagenzia: () => request("/api/immobili-esterni/multiagenzia"),
  aggiornaStatoContatto: (id, stato, messaggio) => request(`/api/immobili-esterni/${id}/stato-contatto?stato=${stato}${messaggio ? "&messaggio="+encodeURIComponent(messaggio) : ""}`, { method: "PATCH" }),
  getRichieste: (params = {}) => request(`/api/richieste?${new URLSearchParams(params)}`),
  creaRichiesta: (data) => request("/api/richieste", { method: "POST", body: JSON.stringify(data) }),
  getMatching: (params = {}) => request(`/api/matching?${new URLSearchParams(params)}`),
  calcolaMatching: () => request("/api/matching/calcola", { method: "POST" }),
  segnaProposto: (id) => request(`/api/matching/${id}/proposto`, { method: "PATCH" }),
  creaComunicazione: (data) => request("/api/comunicazioni", { method: "POST", body: JSON.stringify(data) }),
  getAppuntamenti: (params = {}) => request(`/api/appuntamenti?${new URLSearchParams(params)}`),
  creaAppuntamento: (data) => request("/api/appuntamenti", { method: "POST", body: JSON.stringify(data) }),
  aggiornaAppuntamento: (id, data) => request(`/api/appuntamenti/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getScoutingOggi: () => request("/api/scouting/oggi"),
  getCaccia: (params = {}) => request(`/api/caccia?${new URLSearchParams({ limit: 150, ...params })}`),
  getCacciaStats: () => request("/api/caccia/stats"),
  getCacciaDettaglio: (id) => request(`/api/caccia/${id}`),
  aggiornaCaccia: (id, data) => request(`/api/caccia/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  creaAttivitaCaccia: (id, data) => request(`/api/caccia/${id}/attivita`, { method: "POST", body: JSON.stringify(data) }),
  aggiornaAttivitaCaccia: (attivitaId, data) => request(`/api/caccia/attivita/${attivitaId}`, { method: "PATCH", body: JSON.stringify(data) }),
  eliminaAttivitaCaccia: (attivitaId) => request(`/api/caccia/attivita/${attivitaId}`, { method: "DELETE" }),
  aggiungiAnnuncioCaccia: (id, data) => request(`/api/caccia/${id}/annunci`, { method: "POST", body: JSON.stringify(data) }),
  eliminaAnnuncioCaccia: (annuncioId) => request(`/api/caccia/annunci/${annuncioId}`, { method: "DELETE" }),
  escludiAnnuncioCaccia: (id, data) => request(`/api/caccia/${id}/annunci/escludi`, { method: "POST", body: JSON.stringify(data) }),
  ripristinaAnnuncioCaccia: (id, data) => request(`/api/caccia/${id}/annunci/ripristina`, { method: "POST", body: JSON.stringify(data) }),
}

export const fmt = (n) => n ? "€" + Number(n).toLocaleString("it-IT", { maximumFractionDigits: 0 }) : "—"
export const fmtMq = (n) => n ? `${n} mq` : ""
export const fmtData = (d) => d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—"
export const fmtOra = (d) => d ? new Date(d).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—"
