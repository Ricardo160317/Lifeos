-- LifeOS — esquema de base de datos (Postgres)

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planes_vida (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  vision_texto TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pilares (
  id SERIAL PRIMARY KEY,
  plan_vida_id INT REFERENCES planes_vida(id) ON DELETE CASCADE,
  nombre VARCHAR(80) NOT NULL,
  orden INT DEFAULT 0,
  objetivo TEXT,
  meta TEXT
);
ALTER TABLE pilares ADD COLUMN IF NOT EXISTS objetivo TEXT;
ALTER TABLE pilares ADD COLUMN IF NOT EXISTS meta TEXT;

CREATE TABLE IF NOT EXISTS prioridades (
  id SERIAL PRIMARY KEY,
  pilar_id INT REFERENCES pilares(id) ON DELETE CASCADE,
  texto VARCHAR(200) NOT NULL,
  orden INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS objetivos (
  id SERIAL PRIMARY KEY,
  pilar_id INT REFERENCES pilares(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  motivo TEXT,
  valor_actual VARCHAR(100),
  valor_meta VARCHAR(100),
  fecha_objetivo DATE,
  prioridad VARCHAR(10) DEFAULT 'media',
  estado VARCHAR(20) DEFAULT 'activo', -- activo, logrado, pausado
  creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habitos (
  id SERIAL PRIMARY KEY,
  pilar_id INT REFERENCES pilares(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  frecuencia VARCHAR(20) DEFAULT 'diario', -- diario, semanal
  activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS habito_registros (
  id SERIAL PRIMARY KEY,
  habito_id INT REFERENCES habitos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  cumplido BOOLEAN DEFAULT true,
  UNIQUE(habito_id, fecha)
);

CREATE TABLE IF NOT EXISTS kpis (
  id SERIAL PRIMARY KEY,
  pilar_id INT REFERENCES pilares(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  valor_actual NUMERIC(14,2) DEFAULT 0,
  valor_meta NUMERIC(14,2) DEFAULT 0,
  unidad VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS reglas_decision (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  texto VARCHAR(200) NOT NULL,
  orden INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS revisiones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(10) DEFAULT 'semanal', -- semanal, mensual, anual
  fecha DATE DEFAULT current_date,
  logre TEXT,
  fallo TEXT,
  aprendi TEXT,
  prioridad_siguiente TEXT,
  resumen_ia TEXT
);

CREATE INDEX IF NOT EXISTS idx_pilares_plan ON pilares(plan_vida_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_pilar ON objetivos(pilar_id);
CREATE INDEX IF NOT EXISTS idx_habitos_pilar ON habitos(pilar_id);
CREATE INDEX IF NOT EXISTS idx_registros_habito ON habito_registros(habito_id);
CREATE INDEX IF NOT EXISTS idx_kpis_pilar ON kpis(pilar_id);
CREATE INDEX IF NOT EXISTS idx_prioridades_pilar ON prioridades(pilar_id);
CREATE INDEX IF NOT EXISTS idx_reglas_usuario ON reglas_decision(usuario_id);
