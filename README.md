# LifeOS

Tu sistema operativo personal: visión, pilares, objetivos, hábitos, KPIs y revisiones — con onboarding conversacional por IA.

## Arquitectura
- **Backend**: Node/Express + Postgres (mismo stack que NEX-FIT)
- **Frontend**: React + Vite + Tailwind
- **IA**: proxy server-side a la API de Claude (la API key nunca se expone al navegador)

## Estructura
```
lifeos/
├── backend/
│   ├── server.js          # servidor Express
│   ├── db/
│   │   ├── schema.sql      # esquema completo de Postgres
│   │   ├── migrate.js      # aplica el esquema
│   │   └── pool.js         # conexión a la base de datos
│   ├── middleware/auth.js  # JWT
│   └── routes/
│       ├── auth.js         # registro / login
│       ├── onboarding.js   # chat con IA + guardado del plan generado
│       └── plan.js         # CRUD de objetivos, hábitos, KPIs, revisiones
└── frontend/
    └── src/
        ├── api.js           # cliente HTTP hacia el backend
        ├── App.jsx          # enrutamiento simple (login → onboarding → dashboard)
        └── pages/
            ├── Login.jsx
            ├── Onboarding.jsx  # chat conversacional con opciones tipo botón
            └── Dashboard.jsx   # visión general + vista por pilar + revisión semanal
```

## Cómo correrlo en local

### 1. Base de datos
Crea una base Postgres (local o en Railway, igual que tus otros proyectos) y aplica el esquema:
```bash
cd backend
cp .env.example .env   # completa DATABASE_URL, JWT_SECRET y OPENAI_API_KEY
npm install
npm run migrate
```

### 2. Backend
```bash
npm run dev   # http://localhost:3001
```

### 3. Frontend
```bash
cd ../frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3001
npm install
npm run dev   # http://localhost:5173
```

## Deploy (mismo patrón que tus otros proyectos en Railway)
- Un servicio para `backend/` con las variables de entorno del `.env.example` (agrega `OPENAI_API_KEY` real)
- Un servicio para `frontend/` (o servido como estático desde el backend si prefieres un solo deploy)
- Corre `npm run migrate` una vez contra la base de producción para crear las tablas

## Qué falta para producción real (siguiente iteración)
- Multi-usuario ya está soportado en el esquema (cada plan de vida cuelga de `usuario_id`), pero falta UI de "editar mi plan" más allá de agregar objetivos/hábitos/KPIs sueltos
- IA Coach que analice tendencias y genere resúmenes automáticos de las revisiones (la tabla `revisiones.resumen_ia` ya está lista para recibirlo)
- Reordenar/editar/eliminar objetivos, hábitos y KPIs (hoy solo se pueden crear y marcar)
- Calendario de hábitos visual (hoy solo se ve racha y % de cumplimiento)
- Revisión mensual/anual (la tabla ya soporta el campo `tipo`, falta la UI)
