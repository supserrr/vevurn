import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    credentials: "include", // Include cookies for Better Auth
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    getSession
} = authClient;
