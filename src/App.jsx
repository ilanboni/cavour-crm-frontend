import { Routes, Route, NavLink, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { osservaStatoDb } from "./api.js"
import Dashboard from "./pages/Dashboard.jsx"
import Clienti from "./pages/Clienti.jsx"
import ClienteDetail from "./pages/ClienteDetail.jsx"
import Immobili from "./pages/Immobili.jsx"
import ImmobileDetail from "./pages/ImmobileDetail.jsx"
import Scouting from "./pages/Scouting.jsx"
import Caccia from "./pages/Caccia.jsx"
import Agenda from "./pages/Agenda.jsx"

const navItems = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/clienti", label: "Clienti", icon: "◉" },
  { to: "/immobili", label: "Immobili", icon: "⬡" },
  { to: "/scouting", label: "Scouting", icon: "◎" },
  { to: "/caccia", label: "Caccia", icon: "◆" },
  { to: "/agenda", label: "Agenda", icon: "◷" },
]

const pageTitles = { "/": "Dashboard", "/clienti": "Clienti", "/immobili": "Immobili", "/scouting": "Scouting", "/caccia": "Caccia", "/agenda": "Agenda" }

// Quanto fa che risale il dato, detto come lo direbbe una persona.
function quantoFa(iso) {
  if (!iso) return ""
  const minuti = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minuti < 1) return "di meno di un minuto fa"
  if (minuti === 1) return "di un minuto fa"
  if (minuti < 60) return `di ${minuti} minuti fa`
  const ore = Math.round(minuti / 60)
  return ore === 1 ? "di un'ora fa" : `di ${ore} ore fa`
}

// La fascia che compare quando il database non risponde. Senza questa, il CRM
// mostrava pagine vuote e non si distingueva "non ci sono dati" da "non li so
// leggere": il 18 novembre 2026 e' durato due ore.
function FasciaDatabase() {
  const [stato, setStato] = useState({ degradato: false, datiVecchiIso: null })
  const [, ridisegna] = useState(0)

  useEffect(() => osservaStatoDb(setStato), [])

  // Il "di N minuti fa" invecchia da solo mentre la fascia resta aperta.
  useEffect(() => {
    if (!stato.degradato) return
    const t = setInterval(() => ridisegna(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [stato.degradato])

  if (!stato.degradato) return null
  const eta = quantoFa(stato.datiVecchiIso)

  return (
    <div className="fascia-degrado" role="status">
      <span className="fascia-degrado-punto" />
      <span>
        <strong>Il database non risponde.</strong>{" "}
        {stato.datiVecchiIso
          ? `Quello che vedi è l'ultima copia buona, ${eta}. Le modifiche non vengono salvate.`
          : "Alcune pagine non hanno dati da mostrare. Le modifiche non vengono salvate."}
      </span>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    const d = new Date()
    const giorni = ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"]
    const mesi = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"]
    setDateStr(`${giorni[d.getDay()]} ${d.getDate()} ${mesi[d.getMonth()]}`)
  }, [])

  const title = pageTitles[location.pathname] || "Cavour CRM"

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-main">CAVOUR</div>
          <div className="sidebar-logo-sub">Immobiliare · Milano</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">Ilan Boni · Via Statuto 10</div>
      </aside>
      <div className="content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-right"><span>{dateStr}</span></div>
        </header>
        <main className="page">
          <FasciaDatabase />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clienti" element={<Clienti />} />
            <Route path="/clienti/:id" element={<ClienteDetail />} />
            <Route path="/immobili" element={<Immobili />} />
            <Route path="/immobili/:id" element={<ImmobileDetail />} />
            <Route path="/scouting" element={<Scouting />} />
            <Route path="/caccia" element={<Caccia />} />
            <Route path="/agenda" element={<Agenda />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
