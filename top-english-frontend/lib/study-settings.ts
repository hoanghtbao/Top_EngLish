/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Quản lý cấu hình phiên học từ vựng (Đáp án tức thì, Phát âm, Tự chuyển câu 1.2s, Chiều câu hỏi)
 */

export type StudyDirection = "mixed" | "en-vi" | "vi-en";

export interface StudySessionSettings {
  direction: StudyDirection;
  instantAnswer: boolean;
  autoAudio: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_STUDY_SETTINGS: StudySessionSettings = {
  direction: "en-vi",
  instantAnswer: true,
  autoAudio: true,
  autoAdvance: true,
};

const STORAGE_KEY = "topenglish_study_session_settings";

export function loadStudySettings(): StudySessionSettings {
  if (typeof window === "undefined") return DEFAULT_STUDY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STUDY_SETTINGS;
    const parsed = JSON.parse(raw);
    const dir: StudyDirection =
      parsed?.direction === "vi-en" || parsed?.direction === "mixed"
        ? parsed.direction
        : "en-vi";
    return {
      direction: dir,
      instantAnswer:
        typeof parsed?.instantAnswer === "boolean" ? parsed.instantAnswer : true,
      autoAudio: typeof parsed?.autoAudio === "boolean" ? parsed.autoAudio : true,
      autoAdvance:
        typeof parsed?.autoAdvance === "boolean" ? parsed.autoAdvance : true,
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

export function getDirectionBadgeLabel(direction: StudyDirection): string {
  if (direction === "vi-en") return "VIỆT → ANH";
  if (direction === "mixed") return "TRỘN ĐỀU";
  return "ANH → VIỆT";
}
