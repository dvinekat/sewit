import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell, AuthLink } from "@/components/auth/auth-shell";
import { AuthAlert } from "@/components/auth/form-parts";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth/guards";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в личный кабинет SewIt: избранное, мерки и купленные выкройки.",
  robots: { index: false, follow: false },
};

const LOGIN_NOTICES: Record<string, string> = {
  link: "Ссылка из письма устарела или уже использована. Запросите новое письмо.",
  recovery: "Ссылка для сброса пароля устарела. Запросите новую — и задайте пароль снова.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await getSessionUser();

  // Уже вошли — не показываем форму повторно.
  if (user) redirect(next);

  const notice = params.error ? LOGIN_NOTICES[params.error] : undefined;

  return (
    <AuthShell
      title="С возвращением"
      description="Войдите, чтобы открыть избранное, сохранённые мерки и купленные лекала."
      footer={
        <>
          Нет аккаунта?{" "}
          <AuthLink href={`/register?next=${encodeURIComponent(next)}`}>
            Зарегистрироваться
          </AuthLink>
        </>
      }
    >
      <div className="space-y-4">
        {notice ? <AuthAlert>{notice}</AuthAlert> : null}

        <LoginForm next={next} />

        <p className="text-center text-sm">
          <AuthLink href="/reset-password">Забыли пароль?</AuthLink>
        </p>
      </div>
    </AuthShell>
  );
}
