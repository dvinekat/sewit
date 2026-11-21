#!/usr/bin/env node
/**
 * Ротация паролей демо-пользователей на боевой базе.
 *
 * Зачем: `seed.sql` лежит в публичном репозитории, поэтому пароль из него не
 * должен работать на проде. Сид создаёт пользователей только при первом
 * запуске (`on conflict do nothing`), а этот скрипт задаёт боевые пароли из
 * окружения — в git они не попадают.
 *
 * Переменные (в `.env.local`):
 *   DEMO_ADMIN_PASSWORD — обязательна для ротации админа;
 *   DEMO_BUYER_PASSWORD — необязательна, если нужно сменить и покупателя.
 *
 * Запуск: node --env-file=.env.local scripts/rotate-demo-passwords.mjs
 *
 * Пароли в вывод не печатаются: только статус проверки входа.
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const targets = [
  { email: "admin@sewit.example", password: process.env.DEMO_ADMIN_PASSWORD, role: "admin" },
  { email: "user@sewit.example", password: process.env.DEMO_BUYER_PASSWORD, role: "buyer" },
].filter((target) => Boolean(target.password));

if (targets.length === 0) {
  console.error("Не задан ни DEMO_ADMIN_PASSWORD, ни DEMO_BUYER_PASSWORD — менять нечего");
  process.exit(1);
}

const service = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findByEmail(email) {
  let page = 1;

  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 200) return null;

    page += 1;
  }
}

async function canSignIn(email, password) {
  const response = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return response.ok;
}

let failed = false;

for (const target of targets) {
  const user = await findByEmail(target.email);

  if (!user) {
    console.error(`✗ ${target.email}: пользователь не найден`);
    failed = true;
    continue;
  }

  const previousWorked = await canSignIn(target.email, "sewit-demo");
  const { error } = await service.auth.admin.updateUserById(user.id, {
    password: target.password,
  });

  if (error) {
    console.error(`✗ ${target.email}: ${error.message}`);
    failed = true;
    continue;
  }

  const newWorks = await canSignIn(target.email, target.password);
  const oldStillWorks = await canSignIn(target.email, "sewit-demo");

  if (!newWorks || oldStillWorks) {
    console.error(
      `✗ ${target.email}: проверка не прошла (новый пароль ${newWorks ? "ок" : "нет"}, старый ${oldStillWorks ? "ещё работает" : "закрыт"})`,
    );
    failed = true;
    continue;
  }

  console.log(
    `✓ ${target.email} (${target.role}): пароль обновлён; старый «sewit-demo» ${previousWorked ? "работал и теперь закрыт" : "не работал и не работает"}`,
  );
}

if (failed) process.exit(1);
console.log("\nГотово. Боевые пароли хранятся в .env.local (в git не попадают).");
