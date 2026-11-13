import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/auth/guards";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт SewIt: мерки, избранное и библиотека выкроек.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await getSessionUser();

  if (user) redirect(next);

  return (
    <AuthShell
      title="Создать аккаунт"
      description="Один аккаунт — мерки, избранное и все купленные лекала в личном кабинете."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <AuthLink href={`/login?next=${encodeURIComponent(next)}`}>Войти</AuthLink>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
