"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const redirectWithError = (message: string) => {
  redirect(`/account?error=${encodeURIComponent(message)}`);
};

export async function signInAction(formData: FormData) {
  if (!auth) {
    redirectWithError("Auth is not configured yet.");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithError("Email and password are required.");
  }

  const { error } = await auth!.signIn.email({
    email,
    password,
  });

  if (error) {
    redirectWithError(error.message ?? "Could not sign in.");
  }

  revalidatePath("/");
  revalidatePath("/account");
  redirect("/account");
}

export async function signUpAction(formData: FormData) {
  if (!auth) {
    redirectWithError("Auth is not configured yet.");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nameInput = String(formData.get("name") ?? "").trim();
  const fallbackName = email.split("@")[0]?.trim() || "notube learner";
  const name = nameInput || fallbackName;

  if (!email || !password) {
    redirectWithError("Email and password are required.");
  }

  const { error } = await auth!.signUp.email({
    email,
    password,
    name,
  });

  if (error) {
    redirectWithError(error.message ?? "Could not create your account.");
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
