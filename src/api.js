const API_BASE = import.meta.env.VITE_API_URL || "https://web-production-f9d5d.up.railway.app"

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  getClienti: (params = {}) => request(`/api/clienti?${new URLSearchParams({ limit: 100, ...params })}`),
  getCliente: (id) => request(`/api/clienti/${id}`),
  getComunicazioniCliente: (id) => request(`/api/clienti/${id}/comunicazioni`),
  getAppuntamentiCliente: (id) => request(`/api/clienti/${id}/appuntamenti`),
  getDocumentiCliente: (id) => request(`/api/clienti/${id}/documenti`),
  getRichiesteCliente: (id) => request(`/api/clienti/${id}/richieste`),
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
}

export const fmt = (n) => n ? "€" + Number(n).toLocaleString("it-IT", { maximumFractionDigits: 0 }) : "—"
export const fmtMq = (n) => n ? `${n} mq` : ""
export const fmtData = (d) => d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—"
export const fmtOra = (d) => d ? new Date(d).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—"
