import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8000",
  plugins: [
    adminClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
