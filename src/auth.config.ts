import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ request, auth }) {
      if (!request.nextUrl.pathname.startsWith("/admin")) {
        return true;
      }

      if (isAdminEmail(auth?.user?.email)) {
        return true;
      }

      const signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
      return NextResponse.redirect(signInUrl);
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
  providers: [],
} satisfies NextAuthConfig;
