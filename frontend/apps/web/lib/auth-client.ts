import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:5000", // Your backend URL
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    getSession
} = authClient;
