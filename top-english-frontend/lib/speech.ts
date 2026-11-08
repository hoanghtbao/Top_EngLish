/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Tiện ích phát âm từ vựng tiếng Anh sử dụng trình duyệt Web Speech API chuẩn
 */

export function speakText(text: string, lang = 'en-US', rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Web Speech API không được hỗ trợ trên trình duyệt này');
      resolve();
      return;
    }

    // Dừng âm thanh đang phát trước đó nếu có
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // Tốc độ hơi chậm một chút để học viên nghe rõ phát âm

    const voices = window.speechSynthesis.getVoices();
    // Ưu tiên chọn giọng tiếng Anh chuẩn Mỹ (en-US)
    const enVoice =
      voices.find((v) => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (enVoice) {
      utterance.voice = enVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}
