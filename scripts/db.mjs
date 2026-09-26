// Utilidades de base de datos para desarrollo. Lee DATABASE_URL de .env.local.
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const cmd = process.argv[2];

if (cmd === "push") {
  const r = spawnSync("npx", ["supabase", "db", "push", "--db-url", url, "--yes"], { stdio: "inherit", shell: true });
  process.exit(r.status ?? 1);
} else if (cmd === "types") {
  const r = spawnSync("npx", ["supabase", "gen", "types", "typescript", "--db-url", url, "--schema", "public"], { shell: true, encoding: "utf8", maxBuffer: 1 << 24 });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  writeFileSync("src/lib/supabase/database.types.ts", r.stdout);
  console.log("Tipos generados en src/lib/supabase/database.types.ts");
} else if (cmd === "seed") {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  client.on("notice", (n) => console.log(n.message));
  await client.connect();
  try {
    await client.query(readFileSync("supabase/seed.sql", "utf8"));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
} else {
  console.error("Uso: node scripts/db.mjs push|seed|types");
  process.exit(1);
}
