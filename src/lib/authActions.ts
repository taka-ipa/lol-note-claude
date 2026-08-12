"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signInWithDiscord(callbackUrl?: string) {
  await signIn("discord", { redirectTo: callbackUrl });
}
