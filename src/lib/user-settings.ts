import { useSyncExternalStore } from "react";
import { QuizMode } from "@/lib/types";

const STORAGE_KEY = "notube-user-settings";
const CHANGE_EVENT = "notube-user-settings-change";

export interface UserSettings {
  quizMode: QuizMode;
}

const DEFAULT_SETTINGS: UserSettings = {
  quizMode: "standard",
};

const readQuizMode = (): QuizMode => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS.quizMode;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS.quizMode;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return parsed.quizMode === "advanced" ? "advanced" : "standard";
  } catch {
    return DEFAULT_SETTINGS.quizMode;
  }
};

export const readUserSettings = (): UserSettings => {
  return {
    quizMode: readQuizMode(),
  };
};

export const writeUserSettings = (next: UserSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};

  const onChange = () => onStoreChange();
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
};

export const useUserSettings = () => {
  const quizMode = useSyncExternalStore(subscribe, readQuizMode, () => DEFAULT_SETTINGS.quizMode);
  return { quizMode };
};
