import { describe, expect, it } from "vitest";

import { ADMIN_DENIED_REDIRECT, decideAccess } from "@/lib/access";

const guest = { isAuthenticated: false, isAdmin: false };
const buyer = { isAuthenticated: true, isAdmin: false };
const admin = { isAuthenticated: true, isAdmin: true };

describe("decideAccess: /account", () => {
  it("анонима отправляет на вход", () => {
    expect(decideAccess("/account", guest)).toEqual({ kind: "login" });
    expect(decideAccess("/account/favorites", guest)).toEqual({ kind: "login" });
  });

  it("пускает вошедшего пользователя", () => {
    expect(decideAccess("/account", buyer)).toEqual({ kind: "allow" });
    expect(decideAccess("/account/favorites", buyer)).toEqual({ kind: "allow" });
  });

  it("не трогает пути, только похожие на /account", () => {
    expect(decideAccess("/accounting", guest)).toEqual({ kind: "allow" });
    expect(decideAccess("/catalog", guest)).toEqual({ kind: "allow" });
  });
});

describe("decideAccess: /admin", () => {
  it("анонима отправляет на вход", () => {
    expect(decideAccess("/admin", guest)).toEqual({ kind: "login" });
  });

  it("покупателя без роли admin отправляет в кабинет с пояснением", () => {
    expect(decideAccess("/admin", buyer)).toEqual({
      kind: "deny",
      redirectTo: ADMIN_DENIED_REDIRECT,
    });
    expect(decideAccess("/admin/patterns", buyer)).toEqual({
      kind: "deny",
      redirectTo: ADMIN_DENIED_REDIRECT,
    });
  });

  it("пускает администратора во вложенные разделы", () => {
    expect(decideAccess("/admin", admin)).toEqual({ kind: "allow" });
    expect(decideAccess("/admin/orders", admin)).toEqual({ kind: "allow" });
  });
});
