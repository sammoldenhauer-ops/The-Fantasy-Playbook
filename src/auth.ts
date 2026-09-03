import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";

import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const providers = [
  Google,
  ...(process.env.AUTH_EMAIL_SERVER
    ? [
        Nodemailer({
          server: process.env.AUTH_EMAIL_SERVER,
          from: process.env.AUTH_EMAIL_FROM,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
});
