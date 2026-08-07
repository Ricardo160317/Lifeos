import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../api";

export default function Login({ onEntrar }) {
  const [modo, setModo] = useState("login"); // login | registro
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = modo === "login" ? await api.login(form) : await api.registro(form);
      localStorage.setItem("lifeos_token", data.token);
      onEntrar(data.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Sparkles size={22} className="text-amber-500" />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-semibold text-stone-900">LifeOS</span>
        </div>
        <form onSubmit={enviar} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-semibold text-stone-900 mb-2">
            {modo === "login" ? "Ingresa a tu LifeOS" : "Crea tu cuenta"}
          </h2>
          {modo === "registro" && (
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" required />
          <input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => set("password", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" required />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <button disabled={cargando} className="w-full bg-stone-900 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-lg">
            {cargando ? "Cargando..." : modo === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
          <button type="button" onClick={() => setModo(modo === "login" ? "registro" : "login")} className="w-full text-xs text-stone-500 pt-1">
            {modo === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Ingresa"}
          </button>
        </form>
      </div>
    </div>
  );
}
