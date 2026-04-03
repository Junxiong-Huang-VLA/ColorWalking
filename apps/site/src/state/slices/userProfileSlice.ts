import type { UserProfileState } from "../types";

function safeTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
  } catch {
    return "Asia/Shanghai";
  }
}

export function createInitialUserProfile(nowIso: string): UserProfileState {
  return {
    userId: "user-local",
    nickname: "你",
    timezone: safeTimeZone(),
    createdAt: nowIso,
    preferredInputMode: "text",
    gentleModeEnabled: true,
    experienceFeedback: {
      wantsPhysical: null,
      favoriteScene: null,
      favoriteColorExperience: null,
      joinWaitlist: null,
      contact: null,
      continueUsing: null,
      updatedAt: null
    },
    surveySubmissions: []
  };
}
