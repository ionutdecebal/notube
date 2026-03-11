import { QuizMode } from "@/lib/types";

export interface UserSettingsPayload {
  authEnabled: boolean;
  authenticated: boolean;
  settings: {
    quizMode: QuizMode;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const DEFAULT_QUIZ_MODE: QuizMode = "standard";

export const loadUserSettings = async (): Promise<UserSettingsPayload> => {
  try {
    const response = await fetch("/api/user-settings", { cache: "no-store" });
    if (!response.ok) {
      return {
        authEnabled: false,
        authenticated: false,
        settings: {
          quizMode: DEFAULT_QUIZ_MODE,
        },
      };
    }

    return (await response.json()) as UserSettingsPayload;
  } catch {
    return {
      authEnabled: false,
      authenticated: false,
      settings: {
        quizMode: DEFAULT_QUIZ_MODE,
      },
    };
  }
};
