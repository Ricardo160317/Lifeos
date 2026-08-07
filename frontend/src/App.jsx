import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import { api } from "./api";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [tienePlan, setTienePlan] = useState(null); // null = sin verificar aún
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lifeos_token");
    if (!token) { setCargando(false); return; }
    api.planCompleto()
      .then((plan) => { setUsuario({}); setTienePlan(!!plan); })
      .catch(() => localStorage.removeItem("lifeos_token"))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">Cargando...</div>;

  if (!usuario) {
    return <Login onEntrar={async () => {
      setUsuario({});
      const plan = await api.planCompleto().catch(() => null);
      setTienePlan(!!plan);
    }} />;
  }

  if (!tienePlan) return <Onboarding onListo={() => setTienePlan(true)} />;

  return <Dashboard />;
}
