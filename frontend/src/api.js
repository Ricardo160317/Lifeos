const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function headers() {
  const token = localStorage.getItem("lifeos_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function req(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: headers() });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error de red");
  return res.json();
}

export const api = {
  registro: (data) => req("/api/auth/registro", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => req("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  onboardingChat: (mensajes) => req("/api/onboarding/chat", { method: "POST", body: JSON.stringify({ mensajes }) }),
  onboardingFinalizar: (plan) => req("/api/onboarding/finalizar", { method: "POST", body: JSON.stringify(plan) }),

  planCompleto: () => req("/api/plan/completo"),
  crearPilar: (data) => req("/api/plan/pilares", { method: "POST", body: JSON.stringify(data) }),
  crearObjetivo: (data) => req("/api/plan/objetivos", { method: "POST", body: JSON.stringify(data) }),
  cambiarEstadoObjetivo: (id, estado) => req(`/api/plan/objetivos/${id}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) }),
  crearHabito: (data) => req("/api/plan/habitos", { method: "POST", body: JSON.stringify(data) }),
  marcarHabito: (id) => req(`/api/plan/habitos/${id}/marcar`, { method: "POST" }),
  crearKpi: (data) => req("/api/plan/kpis", { method: "POST", body: JSON.stringify(data) }),
  actualizarKpi: (id, valorActual) => req(`/api/plan/kpis/${id}`, { method: "PATCH", body: JSON.stringify({ valorActual }) }),
  crearPrioridad: (data) => req("/api/plan/prioridades", { method: "POST", body: JSON.stringify(data) }),
  eliminarPrioridad: (id) => req(`/api/plan/prioridades/${id}`, { method: "DELETE" }),
  reglas: () => req("/api/plan/reglas"),
  crearRegla: (texto) => req("/api/plan/reglas", { method: "POST", body: JSON.stringify({ texto }) }),
  eliminarRegla: (id) => req(`/api/plan/reglas/${id}`, { method: "DELETE" }),
  revisiones: () => req("/api/plan/revisiones"),
  crearRevision: (data) => req("/api/plan/revisiones", { method: "POST", body: JSON.stringify(data) }),
};
