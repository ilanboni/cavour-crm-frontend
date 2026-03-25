import { Routes, Route, NavLink, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import Dashboard from "./pages/Dashboard.jsx"
import Clienti from "./pages/Clienti.jsx"
import ClienteDetail from "./pages/ClienteDetail.jsx"
import Immobili from "./pages/Immobili.jsx"
import ImmobileDetail from "./pages/ImmobileDetail.jsx"
import Scouting from "./pages/Scouting.jsx"
import Agenda from "./pages/Agenda.jsx"

const navItems = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/clienti", label: "Clienti", icon: "◉" },
  { to: "/immobili", label: "Immobili", icon: "⬡" },
  { to: "/scouting", label: "Scouting", icon: "◎" },
  { to: "/agenda", label: "Agenda", icon: "◷" },
]

const pageTitles = { "/": "Dashboard", "/clienti": "Clienti", "/immobili": "Immobili", "/scouting": "Scouting", "/agenda": "Agenda" }

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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clienti" element={<Clienti />} />
            <Route path="/clienti/:id" element={<ClienteDetail />} />
            <Route path="/immobili" element={<Immobili />} />
            <Route path="/immobili/:id" element={<ImmobileDetail />} />
            <Route path="/scouting" element={<Scouting />} />
            <Route path="/agenda" element={<Agenda />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
