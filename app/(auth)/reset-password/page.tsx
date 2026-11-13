import type { Metadata } from "next";

import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { ResetRequestForm } from "@/components/auth/reset-request-form";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: "Сброс пароля SewIt по ссылке из письма.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Забыли пароль?"
      description="Укажите e-mail аккаунта — пришлём ссылку, по которой можно задать новый пароль."
      footer={<AuthLink href="/login">Вернуться ко входу</AuthLink>}
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
