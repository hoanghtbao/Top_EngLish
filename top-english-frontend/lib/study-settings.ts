/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Quản lý cấu hình phiên học từ vựng (Hướng học Anh-Việt/Việt-Anh, Đáp án tức thì, Phát âm)
 */

export interface StudySessionSettings {
  direction: "en-vi" | "vi-en";
  instantAnswer: boolean;
  autoAudio: boolean;
}

export const DEFAULT_STUDY_SETTINGS: StudySessionSettings = {
  direction: "en-vi",
  instantAnswer: true,
  autoAudio: true,
};

const STORAGE_KEY = "topenglish_study_session_settings";

export function loadStudySettings(): StudySessionSettings {
  if (typeof window === "undefined") return DEFAULT_STUDY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STUDY_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      direction: parsed?.direction === "vi-en" ? "vi-en" : "en-vi",
      instantAnswer:
        typeof parsed?.instantAnswer === "boolean" ? parsed.instantAnswer : true,
      autoAudio: typeof parsed?.autoAudio === "boolean" ? parsed.autoAudio : true,
    };
  } catch {
    return DEFAULT_STUDY_SETTINGS;
  }
}

export function saveStudySettings(settings: StudySessionSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}
