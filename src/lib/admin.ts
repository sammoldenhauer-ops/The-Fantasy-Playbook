import type { Session } from "next-auth";

const configuredAdminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && configuredAdminEmails.includes(email.toLowerCase()));
}

export function isAdminSession(session: Session | null): boolean {
  return isAdminEmail(session?.user?.email);
}
