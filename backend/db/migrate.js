import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrar() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(sql);
  console.log("Esquema aplicado correctamente.");
  await pool.end();
}

migrar().catch((e) => {
  console.error("Error aplicando el esquema:", e);
  process.exit(1);
});
