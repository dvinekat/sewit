import type { Metadata } from "next";

import { PromoForm } from "@/components/admin/promo-form";
import { PromoRowActions } from "@/components/admin/promo-row-actions";
import { Badge } from "@/components/ui/badge";
import { EMPTY_PROMO_FORM } from "@/lib/admin/promo-form";
import { listPromoCodes } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Промокоды",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const NOTICES: Record<string, string> = {
  created: "Промокод создан.",
  updated: "Промокод обновлён.",
  enabled: "Промокод включён.",
  disabled: "Промокод выключен.",
  deleted: "Промокод удалён.",
  error: "Не удалось выполнить действие. Обновите страницу и попробуйте ещё раз.",
};

/**
 * Промокоды: список и создание (T-42, FR-8.5, FR-8.6).
 *
 * Список читается клиентом сессии: RLS `promo_codes_admin_all` не отдаёт
 * промокоды ни гостям, ни покупателям. Форма создания — отдельный блок,
 * редактирование — страница `/admin/promo/[id]`.
 */
export default async function AdminPromoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const noticeKey = ["created", "updated", "enabled", "disabled", "deleted", "error"].find((key) =>
    Boolean(params[key]),
  );
  const promos = await listPromoCodes();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Промокоды</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Скидки и лимиты</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Код проверяется на сервере при оформлении: срок, лимит и активность. Удаление промокода не
          меняет уже оплаченные заказы — код в них хранится строкой.
        </p>
      </header>

      {noticeKey ? (
        <p
          role="status"
          className={
            noticeKey === "error"
              ? "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              : "rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage"
          }
        >
          {NOTICES[noticeKey]}
        </p>
      ) : null}

      <section
        aria-labelledby="promo-create"
        className="rounded-2xl border border-line bg-card p-5"
      >
        <h2 id="promo-create" className="font-display text-xl">
          Новый промокод
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Код приводится к верхнему регистру: покупатель может ввести «sew10» или «SEW10».
        </p>
        <PromoForm mode="create" initial={EMPTY_PROMO_FORM} />
      </section>

      <section aria-labelledby="promo-list" className="rounded-2xl border border-line bg-card p-5">
        <h2 id="promo-list" className="font-display text-xl">
          Все промокоды
        </h2>

        {promos.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Промокодов пока нет. Создайте первый — он сразу появится в оформлении заказа.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Код
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Скидка
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Использование
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Действует до
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Статус
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {promos.map((promo) => {
                  const exhausted = promo.usedCount >= promo.maxUses;

                  return (
                    <tr key={promo.id}>
                      <td className="py-3 pr-3 font-medium tracking-wide">{promo.code}</td>
                      <td className="py-3 pr-3">{promo.percent}%</td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {promo.usedCount} из {promo.maxUses}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {promo.expiresAt
                          ? dateFormatter.format(new Date(promo.expiresAt))
                          : "Бессрочно"}
                      </td>
                      <td className="py-3 pr-3">
                        {!promo.active ? (
                          <Badge variant="outline">Выключен</Badge>
                        ) : promo.expired ? (
                          <Badge variant="outline">Истёк</Badge>
                        ) : exhausted ? (
                          <Badge variant="outline">Лимит исчерпан</Badge>
                        ) : (
                          <Badge variant="sage">Активен</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <PromoRowActions id={promo.id} active={promo.active} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
