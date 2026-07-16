import type { DefaultSession } from "next-auth";
// The bare imports make TS treat these declarations as module augmentations.
import type {} from "next-auth/jwt";
import type {} from "next-auth/adapters";

import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
