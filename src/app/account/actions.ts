"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const redirectWithError = (message: string) => {
  redirect(`/account?error=${encodeURIComponent(message)}`);
};

export async function signInAction(formData: FormData) {
  if (!auth) {
    redirectWithError("Account access is unavailable right now.");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithError("Sign-in failed. Check your details and try again.");
  }

  const { error } = await auth!.signIn.email({
    email,
    password,
  });

  if (error) {
    redirectWithError(error.message ?? "Sign-in failed. Check your details and try again.");
  }

  revalidatePath("/");
  revalidatePath("/account");
  redirect("/account");
}

export async function signUpAction(formData: FormData) {
  if (!auth) {
    redirectWithError("Account access is unavailable right now.");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nameInput = String(formData.get("name") ?? "").trim();
  const fallbackName = email.split("@")[0]?.trim() || "notube learner";
  const name = nameInput || fallbackName;

  if (!email || !password) {
    redirectWithError("Account creation failed. Try again in a moment.");
  }

  const { error } = await auth!.signUp.email({
    email,
    password,
    name,
  });

  if (error) {
    redirectWithError(error.message ?? "Account creation failed. Try again in a moment.");
  }

  revalidatePath("/");
  revalidatePath("/account");
  redirect("/account");
}

export async function signOutAction() {
  if (auth) {
    await auth.signOut();
  }

  revalidatePath("/");
  revalidatePath("/account");
  redirect("/account");
}
