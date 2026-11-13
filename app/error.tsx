"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Граница ошибок для всех маршрутов: пользователь видит понятный текст и путь назад,
 * а не стектрейс (DoD README 12, п. 7).
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-7xl text-primary/20">Ой</p>
      <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">Что-то пошло не так</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        Мы уже записали ошибку. Попробуйте обновить страницу — данные должны загрузиться снова.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Попробовать снова
        </Button>
        <Link href="/catalog" className={buttonVariants({ size: "lg", variant: "outline" })}>
          В каталог
        </Link>
      </div>
    </div>
  );
}
