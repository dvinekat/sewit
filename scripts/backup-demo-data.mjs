#!/usr/bin/env node
/**
 * Резерв демо-данных без Supabase CLI и Docker (T-47, бэклог 7.2).
 *
 * Выгружает публичные таблицы через service role в JSON-файлы. Это не замена
 * `supabase db dump` (нет auth.users и определений схемы), но позволяет
 * восстановить контент и заказы, если free-проект уйдёт в паузу или данные
 * испортятся перед демонстрацией.
 *
 * Запуск: node --env-file=.env.local scripts/backup-demo-data.mjs
 * Результат: .cache/backups/<YYYY-MM-DD_HH-mm>/*.json (в git не попадает).
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const TABLES = [
  "categories",
  "patterns",
  "pattern_sizes",
  "pattern_params",
  "pattern_files",
  "promo_codes",
  "profiles",
  "measurements",
  "favorites",
  "orders",
  "order_items",
  "entitlements",
  "download_log",
  "instructions",
];

const PAGE = 1000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function stamp() {
  return new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
}

async function fetchAll(table) {
  const rows = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE) return rows;
  }
}

const directory = path.join(".cache", "backups", stamp());
await mkdir(directory, { recursive: true });

const manifest = { createdAt: new Date().toISOString(), project: process.env.NEXT_PUBLIC_SUPABASE_URL, tables: {} };

for (const table of TABLES) {
  try {
    const rows = await fetchAll(table);
    await writeFile(path.join(directory, `${table}.json`), JSON.stringify(rows, null, 2), "utf8");
    manifest.tables[table] = rows.length;
    console.log(`${table.padEnd(18)} ${rows.length}`);
  } catch (error) {
    manifest.tables[table] = { error: String(error) };
    console.log(`${table.padEnd(18)} ОШИБКА: ${error}`);
  }
}

await writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

console.log(`\nРезерв: ${directory}`);
console.log("Файлы в .cache/ и в git не попадают.");
