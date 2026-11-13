import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { getSessionUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Новый пароль",
  description: "Задайте новый пароль аккаунта SewIt.",
  robots: { index: false, follow: false },
};

export default async function UpdatePasswordPage() {
  const user = await getSessionUser();

  // Ссылка одноразовая: без сессии из письма повторно форму не открыть.
  if (!user) redirect("/login?next=/reset-password/update&error=recovery");

  return (
    <AuthShell
      title="Новый пароль"
      description={`Задайте новый пароль для ${user.email}. После сохранения вы останетесь в аккаунте.`}
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
