import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { isValidEmail, mapAuthError } from "./account-api";
import { toAuthState } from "./auth";

describe("mapAuthError", () => {
  it("email already used → email_exists (invite to sign in, no parallel account)", () => {
    expect(mapAuthError({ code: "email_exists" })).toBe("email_exists");
    expect(mapAuthError({ message: "A user with this email address has already been registered" })).toBe("email_exists");
  });
  it("wrong credentials", () => expect(mapAuthError({ code: "invalid_credentials" })).toBe("invalid_credentials"));
  it("weak password", () => expect(mapAuthError({ code: "weak_password" })).toBe("weak_password"));
  it("unknown errors never leak raw messages", () =>
    expect(mapAuthError({ message: "db host 10.0.0.1 down" })).toBe("unknown"));
});

describe("toAuthState", () => {
  it("anonymous identity is not permanent and exposes no email", () => {
    const s = toAuthState({ id: "u1", is_anonymous: true, email: "" } as never);
    expect(s).toMatchObject({ userId: "u1", isPermanent: false, email: null });
  });
  it("converted account keeps the same user id", () => {
    const s = toAuthState({ id: "u1", is_anonymous: false, email: "a@b.co" } as never);
    expect(s).toMatchObject({ userId: "u1", isPermanent: true, email: "a@b.co" });
  });
  it("pending conversion (email not yet confirmed) stays non-permanent", () => {
    const s = toAuthState({ id: "u1", is_anonymous: true, email: "", new_email: "a@b.co" } as never);
    expect(s).toMatchObject({ isPermanent: false, pendingEmail: "a@b.co" });
  });
});

describe("isValidEmail", () => {
  it("rejects malformed", () => expect(isValidEmail("nope")).toBe(false));
  it("accepts normal", () => expect(isValidEmail("a@b.co")).toBe(true));
});
