import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { api } from "../api";

export default function Onboarding({ onListo }) {
  const [mensajes, setMensajes] = useState([
    { role: "assistant", content: "Cuéntame qué quieres construir o lograr en tu vida — puede cubrir varias áreas, o puedes pegar un plan que ya tengas escrito.", opciones: [] },
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [mensajes, cargando]);

  async function enviar(textoForzado) {
    const contenido = textoForzado ?? input;
    if (!contenido.trim() || cargando) return;
    const nuevosMensajes = [...mensajes, { role: "user", content: contenido }];
    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);
    setError("");
    try {
      const parsed = await api.onboardingChat(nuevosMensajes.map((m) => ({ role: m.role, content: m.content })));
      if (parsed?.tipo === "plan") {
        setMensajes((prev) => [...prev, { role: "assistant", content: "Listo, arme tu plan. Guardándolo..." }]);
        const { planId } = await api.onboardingFinalizar(parsed);
        setTimeout(() => onListo(), 600);
      } else {
        setMensajes((prev) => [...prev, { role: "assistant", content: parsed.texto || "¿Puedes contarme un poco más?", opciones: parsed.opciones || [] }]);
      }
    } catch (e) {
      setError("No se pudo conectar con la IA. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 flex flex-col" style={{ height: "85vh" }}>
        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-semibold text-stone-900">Construyendo tu LifeOS</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {mensajes.map((m, i) => {
            const esUltima = i === mensajes.length - 1;
            return (
              <div key={i}>
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-800"}`}>
                    {m.content}
                  </div>
                </div>
                {m.role === "assistant" && esUltima && m.opciones?.length > 0 && !cargando && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.opciones.map((op, j) => (
                      <button key={j} onClick={() => enviar(op)} className="text-xs border border-stone-300 rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors">
                        {op}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {cargando && <div className="bg-stone-100 rounded-2xl px-3.5 py-2 text-sm text-stone-400 flex items-center gap-1.5 w-fit"><Loader2 size={13} className="animate-spin" /> pensando...</div>}
          {error && <div className="text-xs text-red-600 text-center">{error}</div>}
        </div>

        <div className="px-5 py-4 border-t border-stone-100">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              rows={2}
              placeholder="Escribe tu respuesta..."
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
            <button onClick={() => enviar()} disabled={cargando || !input.trim()} className="w-10 h-10 shrink-0 rounded-xl bg-stone-900 disabled:opacity-30 text-white flex items-center justify-center self-end">
              <Send size={15} />
            </button>
          </div>
          <button onClick={() => enviar("Ya tengo suficiente, genera mi plan ahora con lo que hemos hablado.")} disabled={cargando} className="text-xs text-stone-400 hover:text-stone-600 mt-2">
            Generar mi plan ahora con lo que ya conversamos →
          </button>
        </div>
      </div>
    </div>
  );
}
