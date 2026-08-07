import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function firmarToken(usuario) {
  return jwt.sign({ id: usuario.id, email: usuario.email }, SECRET, { expiresIn: "30d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No autenticado" });
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    req.usuarioId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}
