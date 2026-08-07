import { useState, useEffect, useCallback } from "react";
import { Target, Flame, Plus, X, Check, Sparkles, Heart, Briefcase, Wallet, BookOpen, Users, Sunrise, Edit3, Zap, Compass, ListChecks, Trash2 } from "lucide-react";
import { api } from "../api";

const ICONOS_PILAR = { Salud: Heart, Empresa: Briefcase, Finanzas: Wallet, "Desarrollo Personal": BookOpen, Familia: Users, Espiritualidad: Sunrise, Productividad: Zap, Propósito: Compass };

function diasEntre(fechaISO) {
  return Math.round((new Date() - new Date(fechaISO)) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const [plan, setPlan] = useState(null);
  const [pilarActivo, setPilarActivo] = useState(null);
  const [vista, setVista] = useState("dashboard");
  const [modales, setModales] = useState({});

  const cargar = useCallback(async () => {
    const data = await api.planCompleto();
    setPlan(data);
    if (data?.pilares?.length && !pilarActivo) setPilarActivo(data.pilares[0].id);
  }, [pilarActivo]);

  useEffect(() => { cargar(); }, []);

  if (!plan) return <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">Cargando tu LifeOS...</div>;

  const objetivosDe = (pilarId) => plan.objetivos.filter((o) => o.pilar_id === pilarId);
  const habitosDe = (pilarId) => plan.habitos.filter((h) => h.pilar_id === pilarId);
  const kpisDe = (pilarId) => plan.kpis.filter((k) => k.pilar_id === pilarId);
  const prioridadesDe = (pilarId) => (plan.prioridades || []).filter((pr) => pr.pilar_id === pilarId);
  const registrosDe = (habitoId) => plan.registros.filter((r) => r.habito_id === habitoId);

  function calcularRacha(habitoId) {
    const regs = registrosDe(habitoId).filter((r) => r.cumplido).map((r) => r.fecha).sort().reverse();
    if (regs.length === 0) return 0;
    let racha = 0;
    for (const f of regs) { if (diasEntre(f) === racha) racha++; else break; }
    return racha;
  }
  function porcentaje30(habitoId) {
    const regs = registrosDe(habitoId).filter((r) => diasEntre(r.fecha) <= 29);
    const cumplidos = regs.filter((r) => r.cumplido).length;
    return regs.length === 0 ? 0 : Math.round((cumplidos / 30) * 100);
  }

  async function marcarHabito(id) { await api.marcarHabito(id); cargar(); }
  async function cambiarEstadoObjetivo(id, estado) { await api.cambiarEstadoObjetivo(id, estado); cargar(); }

  const pilarObj = plan.pilares.find((p) => p.id === pilarActivo);

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-stone-100">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-semibold text-lg text-stone-900 flex items-center gap-1.5">
            <Sparkles size={18} className="text-amber-500" /> LifeOS
          </div>
          <div className="text-[11px] text-stone-400 mt-1 line-clamp-2">{plan.vision_texto}</div>
        </div>
        <nav className="flex-1 py-3 overflow-auto">
          <button onClick={() => setVista("dashboard")} className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm ${vista === "dashboard" ? "text-stone-900 font-medium bg-stone-100" : "text-stone-500 hover:bg-stone-50"}`}>
            <Target size={15} /> Visión general
          </button>
          <div className="text-[10px] uppercase tracking-wide text-stone-400 px-5 pt-4 pb-1">Pilares</div>
          {plan.pilares.map((p) => {
            const Icon = ICONOS_PILAR[p.nombre] || Target;
            const active = vista === "pilar" && pilarActivo === p.id;
            return (
              <button key={p.id} onClick={() => { setPilarActivo(p.id); setVista("pilar"); }} className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm ${active ? "text-stone-900 font-medium bg-stone-100" : "text-stone-500 hover:bg-stone-50"}`}>
                <Icon size={15} /> {p.nombre}
              </button>
            );
          })}
          <div className="text-[10px] uppercase tracking-wide text-stone-400 px-5 pt-4 pb-1">Ritual</div>
          <button onClick={() => setVista("revision")} className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm ${vista === "revision" ? "text-stone-900 font-medium bg-stone-100" : "text-stone-500 hover:bg-stone-50"}`}>
            <Edit3 size={15} /> Revisión semanal
          </button>
          <button onClick={() => setVista("reglas")} className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm ${vista === "reglas" ? "text-stone-900 font-medium bg-stone-100" : "text-stone-500 hover:bg-stone-50"}`}>
            <ListChecks size={15} /> Mis reglas
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto max-w-4xl">
        {vista === "dashboard" && (
          <VisionGeneral plan={plan} calcularRacha={calcularRacha} onVerPilar={(id) => { setPilarActivo(id); setVista("pilar"); }} />
        )}
        {vista === "pilar" && pilarObj && (
          <PilarView
            pilar={pilarObj}
            objetivos={objetivosDe(pilarObj.id)}
            habitos={habitosDe(pilarObj.id)}
            kpis={kpisDe(pilarObj.id)}
            prioridades={prioridadesDe(pilarObj.id)}
            calcularRacha={calcularRacha}
            porcentaje30={porcentaje30}
            onMarcarHabito={marcarHabito}
            onCambiarEstadoObjetivo={cambiarEstadoObjetivo}
            onNuevoObjetivo={() => setModales({ objetivo: pilarObj.id })}
            onNuevoHabito={() => setModales({ habito: pilarObj.id })}
            onNuevoKpi={() => setModales({ kpi: pilarObj.id })}
            onAgregarPrioridad={async (texto) => { await api.crearPrioridad({ pilarId: pilarObj.id, texto }); cargar(); }}
            onEliminarPrioridad={async (id) => { await api.eliminarPrioridad(id); cargar(); }}
          />
        )}
        {vista === "revision" && <RevisionView />}
        {vista === "reglas" && <ReglasView reglas={plan.reglas} onCambio={cargar} />}
      </main>

      {modales.objetivo && <ModalObjetivo pilarId={modales.objetivo} onCerrar={() => setModales({})} onCrear={async (d) => { await api.crearObjetivo(d); setModales({}); cargar(); }} />}
      {modales.habito && <ModalHabito pilarId={modales.habito} onCerrar={() => setModales({})} onCrear={async (d) => { await api.crearHabito(d); setModales({}); cargar(); }} />}
      {modales.kpi && <ModalKpi pilarId={modales.kpi} onCerrar={() => setModales({})} onCrear={async (d) => { await api.crearKpi(d); setModales({}); cargar(); }} />}
    </div>
  );
}

function VisionGeneral({ plan, calcularRacha, onVerPilar }) {
  const activos = plan.objetivos.filter((o) => o.estado === "activo").length;
  return (
    <div>
      <div className="bg-stone-900 text-white rounded-2xl p-6 mb-6">
        <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1.5">Tu visión</div>
        <p className="text-sm leading-relaxed text-stone-100">{plan.vision_texto}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-stone-200 p-4"><div className="text-2xl font-semibold text-stone-900">{activos}</div><div className="text-xs text-stone-500">objetivos activos</div></div>
        <div className="bg-white rounded-xl border border-stone-200 p-4"><div className="text-2xl font-semibold text-stone-900">{plan.habitos.length}</div><div className="text-xs text-stone-500">hábitos en seguimiento</div></div>
        <div className="bg-white rounded-xl border border-stone-200 p-4"><div className="text-2xl font-semibold text-stone-900">{plan.pilares.length}</div><div className="text-xs text-stone-500">pilares de tu plan</div></div>
      </div>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold text-stone-800 mb-3">Tus pilares</h3>
      <div className="grid grid-cols-2 gap-3">
        {plan.pilares.map((p) => {
          const Icon = ICONOS_PILAR[p.nombre] || Target;
          const objs = plan.objetivos.filter((o) => o.pilar_id === p.id && o.estado === "activo");
          const habs = plan.habitos.filter((h) => h.pilar_id === p.id);
          return (
            <button key={p.id} onClick={() => onVerPilar(p.id)} className="text-left bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center"><Icon size={16} className="text-stone-700" /></div>
                <span className="text-sm font-medium text-stone-800">{p.nombre}</span>
              </div>
              <div className="text-xs text-stone-500">{objs.length} objetivo(s) activo(s) · {habs.length} hábito(s)</div>
              {habs.length > 0 && <div className="flex items-center gap-1 mt-2 text-xs text-amber-600"><Flame size={12} /> Mejor racha: {Math.max(...habs.map((h) => calcularRacha(h.id)), 0)} días</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PilarView({ pilar, objetivos, habitos, kpis, prioridades, calcularRacha, porcentaje30, onMarcarHabito, onCambiarEstadoObjetivo, onNuevoObjetivo, onNuevoHabito, onNuevoKpi, onAgregarPrioridad, onEliminarPrioridad }) {
  const Icon = ICONOS_PILAR[pilar.nombre] || Target;
  const [nuevaPrioridad, setNuevaPrioridad] = useState("");
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center"><Icon size={18} className="text-white" /></div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-semibold text-stone-900">{pilar.nombre}</h1>
      </div>
      {pilar.objetivo && <p className="text-sm text-stone-500 mb-6 max-w-xl">{pilar.objetivo}</p>}
      {!pilar.objetivo && <div className="mb-6" />}

      <SeccionHeader titulo="Prioridades" onAgregar={null} />
      <div className="space-y-1.5 mb-2">
        {(prioridades || []).length === 0 && <EmptyBox texto="Aún no tienes prioridades definidas en este pilar." />}
        {(prioridades || []).map((pr) => (
          <div key={pr.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700">
            <span>{pr.texto}</span>
            <button onClick={() => onEliminarPrioridad(pr.id)} className="text-stone-300 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        <input
          value={nuevaPrioridad}
          onChange={(e) => setNuevaPrioridad(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && nuevaPrioridad.trim()) { onAgregarPrioridad(nuevaPrioridad.trim()); setNuevaPrioridad(""); } }}
          placeholder="Agregar prioridad..."
          className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <button
          onClick={() => { if (nuevaPrioridad.trim()) { onAgregarPrioridad(nuevaPrioridad.trim()); setNuevaPrioridad(""); } }}
          className="px-3 py-1.5 text-sm font-medium bg-stone-900 text-white rounded-lg"
        >
          Agregar
        </button>
      </div>

      <SeccionHeader titulo="Objetivos" onAgregar={onNuevoObjetivo} />
      <div className="space-y-2 mb-6">
        {objetivos.length === 0 && <EmptyBox texto="Aún no tienes objetivos en este pilar." />}
        {objetivos.map((o) => (
          <div key={o.id} className="bg-white border border-stone-200 rounded-xl p-3.5">
            <div className="flex justify-between items-start">
              <div><div className="text-sm font-medium text-stone-800">{o.nombre}</div>{o.motivo && <div className="text-xs text-stone-400 mt-0.5">{o.motivo}</div>}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${o.estado === "logrado" ? "bg-green-100 text-green-700" : o.estado === "activo" ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"}`}>{o.estado}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-stone-400">
              <span>{o.fecha_objetivo ? `Meta: ${String(o.fecha_objetivo).slice(0, 10)}` : "Sin fecha"} · Prioridad {o.prioridad}</span>
              {o.estado === "activo" && <button onClick={() => onCambiarEstadoObjetivo(o.id, "logrado")} className="text-green-600 font-medium flex items-center gap-1"><Check size={12} /> Marcar logrado</button>}
            </div>
          </div>
        ))}
      </div>
      <SeccionHeader titulo="Hábitos" onAgregar={onNuevoHabito} />
      <div className="space-y-2 mb-6">
        {habitos.length === 0 && <EmptyBox texto="Aún no tienes hábitos en este pilar." />}
        {habitos.map((h) => (
          <div key={h.id} className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-stone-800">{h.nombre}</div>
              <div className="flex items-center gap-3 text-xs text-stone-400 mt-1"><span className="flex items-center gap-1 text-amber-600"><Flame size={12} /> {calcularRacha(h.id)} días</span><span>{porcentaje30(h.id)}% últimos 30 días</span></div>
            </div>
            <button onClick={() => onMarcarHabito(h.id)} className="w-9 h-9 rounded-full border-2 border-stone-200 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-colors"><Check size={16} className="text-stone-400" /></button>
          </div>
        ))}
      </div>
      <SeccionHeader titulo="Indicadores (KPIs)" onAgregar={onNuevoKpi} />
      <div className="grid grid-cols-2 gap-3">
        {kpis.length === 0 && <EmptyBox texto="Sin indicadores todavía." />}
        {kpis.map((k) => {
          const pct = k.valor_meta ? Math.min(100, Math.round((k.valor_actual / k.valor_meta) * 100)) : 0;
          return (
            <div key={k.id} className="bg-white border border-stone-200 rounded-xl p-3.5">
              <div className="text-xs text-stone-500 mb-1">{k.nombre}</div>
              <div className="text-lg font-semibold text-stone-900">{k.valor_actual} {k.unidad} <span className="text-xs text-stone-400 font-normal">/ {k.valor_meta}</span></div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2"><div className="bg-stone-900 h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
      {pilar.meta && (
        <div className="bg-stone-900 text-white rounded-2xl p-4 mt-6">
          <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">Meta de este pilar</div>
          <p className="text-sm text-stone-100">{pilar.meta}</p>
        </div>
      )}
    </div>
  );
}

function SeccionHeader({ titulo, onAgregar }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold text-stone-800">{titulo}</h3>
      {onAgregar && <button onClick={onAgregar} className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"><Plus size={13} /> Agregar</button>}
    </div>
  );
}
function EmptyBox({ texto }) { return <div className="text-xs text-stone-400 bg-white border border-dashed border-stone-200 rounded-xl p-4 text-center">{texto}</div>; }

function RevisionView() {
  const [revisiones, setRevisiones] = useState([]);
  const [mostrar, setMostrar] = useState(false);
  useEffect(() => { api.revisiones().then(setRevisiones); }, []);
  async function guardar(f) {
    await api.crearRevision({ tipo: "semanal", logre: f.logre, fallo: f.fallo, aprendi: f.aprendi, prioridadSiguiente: f.prioridad });
    setMostrar(false);
    api.revisiones().then(setRevisiones);
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-semibold text-stone-900">Revisión semanal</h1>
        <button onClick={() => setMostrar(true)} className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={15} /> Nueva revisión</button>
      </div>
      <div className="space-y-3">
        {revisiones.length === 0 && <EmptyBox texto="Aún no has hecho tu primera revisión semanal." />}
        {revisiones.map((r) => (
          <div key={r.id} className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="text-xs text-stone-400 mb-2">{String(r.fecha).slice(0, 10)}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs font-medium text-stone-500 mb-0.5">Logré</div><div className="text-stone-700">{r.logre}</div></div>
              <div><div className="text-xs font-medium text-stone-500 mb-0.5">Falló</div><div className="text-stone-700">{r.fallo}</div></div>
              <div><div className="text-xs font-medium text-stone-500 mb-0.5">Aprendí</div><div className="text-stone-700">{r.aprendi}</div></div>
              <div><div className="text-xs font-medium text-stone-500 mb-0.5">Próxima prioridad</div><div className="text-stone-700">{r.prioridad_siguiente}</div></div>
            </div>
          </div>
        ))}
      </div>
      {mostrar && <ModalRevision onCerrar={() => setMostrar(false)} onGuardar={guardar} />}
    </div>
  );
}

function ReglasView({ reglas, onCambio }) {
  const [nueva, setNueva] = useState("");
  async function agregar() {
    if (!nueva.trim()) return;
    await api.crearRegla(nueva.trim());
    setNueva("");
    onCambio();
  }
  async function eliminar(id) {
    await api.eliminarRegla(id);
    onCambio();
  }
  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-semibold text-stone-900 mb-1">Mis reglas</h1>
      <p className="text-sm text-stone-500 mb-6 max-w-xl">Preguntas filtro para tomar decisiones alineadas con tu visión. Si la respuesta es "no", reconsidera esa decisión.</p>
      <div className="space-y-2 mb-4">
        {(reglas || []).length === 0 && <EmptyBox texto="Aún no tienes reglas de decisión definidas." />}
        {(reglas || []).map((r) => (
          <div key={r.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700">
            <span>{r.texto}</span>
            <button onClick={() => eliminar(r.id)} className="text-stone-300 hover:text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") agregar(); }}
          placeholder="¿Esto me acerca a mi visión?"
          className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <button onClick={agregar} className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg">Agregar</button>
      </div>
    </div>
  );
}

function ModalObjetivo({ pilarId, onCerrar, onCrear }) {
  const [f, setF] = useState({ nombre: "", motivo: "", fechaObjetivo: "", prioridad: "media" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <ModalBase titulo="Nuevo objetivo" onCerrar={onCerrar} onGuardar={() => onCrear({ ...f, pilarId })} disabled={!f.nombre.trim()}>
      <Campo label="Nombre"><input value={f.nombre} onChange={(e) => set("nombre", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
      <Campo label="Motivo"><input value={f.motivo} onChange={(e) => set("motivo", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Fecha objetivo"><input type="date" value={f.fechaObjetivo} onChange={(e) => set("fechaObjetivo", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
        <Campo label="Prioridad"><select value={f.prioridad} onChange={(e) => set("prioridad", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></Campo>
      </div>
    </ModalBase>
  );
}
function ModalHabito({ pilarId, onCerrar, onCrear }) {
  const [f, setF] = useState({ nombre: "", frecuencia: "diario" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <ModalBase titulo="Nuevo hábito" onCerrar={onCerrar} onGuardar={() => onCrear({ ...f, pilarId })} disabled={!f.nombre.trim()}>
      <Campo label="Nombre"><input value={f.nombre} onChange={(e) => set("nombre", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
      <Campo label="Frecuencia"><select value={f.frecuencia} onChange={(e) => set("frecuencia", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"><option value="diario">Diario</option><option value="semanal">Algunos días por semana</option></select></Campo>
    </ModalBase>
  );
}
function ModalKpi({ pilarId, onCerrar, onCrear }) {
  const [f, setF] = useState({ nombre: "", valorActual: 0, valorMeta: 100, unidad: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <ModalBase titulo="Nuevo indicador" onCerrar={onCerrar} onGuardar={() => onCrear({ ...f, pilarId })} disabled={!f.nombre.trim()}>
      <Campo label="Nombre"><input value={f.nombre} onChange={(e) => set("nombre", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
      <div className="grid grid-cols-3 gap-2">
        <Campo label="Actual"><input type="number" value={f.valorActual} onChange={(e) => set("valorActual", Number(e.target.value))} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
        <Campo label="Meta"><input type="number" value={f.valorMeta} onChange={(e) => set("valorMeta", Number(e.target.value))} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
        <Campo label="Unidad"><input value={f.unidad} onChange={(e) => set("unidad", e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" /></Campo>
      </div>
    </ModalBase>
  );
}
function ModalRevision({ onCerrar, onGuardar }) {
  const [f, setF] = useState({ logre: "", fallo: "", aprendi: "", prioridad: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <ModalBase titulo="Revisión semanal" onCerrar={onCerrar} onGuardar={() => onGuardar(f)} disabled={false} ancho="max-w-lg">
      <Campo label="¿Qué logré?"><textarea value={f.logre} onChange={(e) => set("logre", e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none" /></Campo>
      <Campo label="¿Qué falló?"><textarea value={f.fallo} onChange={(e) => set("fallo", e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none" /></Campo>
      <Campo label="¿Qué aprendí?"><textarea value={f.aprendi} onChange={(e) => set("aprendi", e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none" /></Campo>
      <Campo label="Prioridad próxima semana"><textarea value={f.prioridad} onChange={(e) => set("prioridad", e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none" /></Campo>
    </ModalBase>
  );
}
function ModalBase({ titulo, onCerrar, onGuardar, disabled, ancho = "max-w-md", children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${ancho} max-h-[85vh] overflow-auto`}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-stone-100">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-semibold text-stone-900">{titulo}</h2>
          <button onClick={onCerrar}><X size={18} className="text-stone-400" /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
        <div className="px-5 py-4 border-t border-stone-100 flex justify-end gap-2">
          <button onClick={onCerrar} className="px-4 py-2 text-sm text-stone-500">Cancelar</button>
          <button disabled={disabled} onClick={onGuardar} className="px-4 py-2 text-sm font-medium bg-stone-900 disabled:opacity-30 text-white rounded-lg">Guardar</button>
        </div>
      </div>
    </div>
  );
}
function Campo({ label, children }) { return <div><label className="text-xs font-medium text-stone-500 mb-1 block">{label}</label>{children}</div>; }
