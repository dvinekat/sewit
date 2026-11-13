import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-7xl text-primary/20">404</p>
      <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">Страница не найдена</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        Возможно, ссылка устарела или в адресе опечатка. Каталог и главная страница на месте.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          На главную
        </Link>
        <Link href="/catalog" className={buttonVariants({ size: "lg", variant: "outline" })}>
          В каталог
        </Link>
      </div>
    </div>
  );
}
