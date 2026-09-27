import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

const providers = [
  ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
      ]
    : []),
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : []),
  ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM
    ? [
        Nodemailer({
          server: process.env.EMAIL_SERVER,
          from: process.env.EMAIL_FROM,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: UserRole }).role ?? "USER";
      }
      return session;
    },
  },
  trustHost: true,
});
