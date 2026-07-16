import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Demo account",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email =
        typeof credentials?.email === "string" ? credentials.email : "";
      const password =
        typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password) {
        return null;
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) {
        return null;
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatches) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

// Google SSO is only registered when its env vars are set, so demo login
// works locally before OAuth is configured.
export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

if (googleConfigured) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Self-hosted (next start behind no proxy): trust the Host header.
  trustHost: true,
  // JWT sessions are required for the credentials provider, and let the
  // proxy check auth without a database query.
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers,
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on sign-in; persist id and role in the token.
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
