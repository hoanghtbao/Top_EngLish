/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Quản lý âm thanh tương tác hệ thống (Sound Context & Web Audio API Engine)
 * Cho phép người dùng tùy chỉnh bật/tắt, âm lượng và kiểu âm thanh (Giọt nước thanh, Bọt nước Pop, Chuông pha lê)
 */

"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type SoundPreset = "water-drop" | "bubble-pop" | "crystal-chime";

interface SoundContextType {
  soundEnabled: boolean;
  soundVolume: number;
  soundPreset: SoundPreset;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setSoundPreset: (preset: SoundPreset) => void;
  playClickSound: (customPreset?: SoundPreset) => void;
  playWaterDrop: () => void;
  playSuccessSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const STORAGE_KEY_ENABLED = "topenglish_sound_enabled";
const STORAGE_KEY_VOLUME = "topenglish_sound_volume";
const STORAGE_KEY_PRESET = "topenglish_sound_preset";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [soundVolume, setSoundVolumeState] = useState<number>(0.75);
  const [soundPreset, setSoundPresetState] = useState<SoundPreset>("water-drop");
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Khởi tạo cài đặt âm thanh từ localStorage khi mount trên Client
  useEffect(() => {
    try {
      const storedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
      if (storedEnabled !== null) {
        setSoundEnabledState(storedEnabled === "true");
      }

      const storedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
      if (storedVolume !== null) {
        const parsed = parseFloat(storedVolume);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          setSoundVolumeState(parsed);
        }
      }

      const storedPreset = localStorage.getItem(STORAGE_KEY_PRESET) as SoundPreset;
      if (
        storedPreset === "water-drop" ||
        storedPreset === "bubble-pop" ||
        storedPreset === "crystal-chime"
      ) {
        setSoundPresetState(storedPreset);
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
  }, []);

  // Cập nhật và lưu trạng thái bật/tắt
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
    } catch {
      // Ignored
    }
  }, []);

  // Cập nhật và lưu âm lượng
  const setSoundVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setSoundVolumeState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped));
    } catch {
      // Ignored
    }
  }, []);

  // Cập nhật và lưu kiểu âm thanh preset
  const setSoundPreset = useCallback((preset: SoundPreset) => {
    setSoundPresetState(preset);
    try {
      localStorage.setItem(STORAGE_KEY_PRESET, preset);
    } catch {
      // Ignored
    }
  }, []);

  // 1. TỔNG HỢP ÂM THANH GIỌT NƯỚC THANH THOÁT (Pure Water Droplet Sound)
  const synthesizeWaterDrop = useCallback((ctx: AudioContext, vol: number) => {
    const now = ctx.currentTime;

    // Giọt nước chính (Chirp hình sin từ 1050Hz vọt lên 2350Hz rồi ngân nhẹ)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1050, now);
    osc1.frequency.exponentialRampToValueAtTime(2350, now + 0.035);
    osc1.frequency.exponentialRampToValueAtTime(1450, now + 0.12);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(vol * 0.65, now + 0.007);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.16);

    // Họa âm phụ (Tạo độ trong vắt như giọt pha lê rơi xuống mặt nước)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(2600, now + 0.008);
    osc2.frequency.exponentialRampToValueAtTime(3400, now + 0.045);

    gain2.gain.setValueAtTime(0.0001, now + 0.008);
    gain2.gain.linearRampToValueAtTime(vol * 0.28, now + 0.016);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.008);
    osc2.stop(now + 0.13);
  }, []);

  // 2. TỔNG HỢP ÂM THANH BỌT NƯỚC POP VUI NHỘN (Bubble Pop)
  const synthesizeBubblePop = useCallback((ctx: AudioContext, vol: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.05);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }, []);

  // 3. TỔNG HỢP ÂM THANH CHUÔNG PHA LÊ (Crystal Chime)
  const synthesizeCrystalChime = useCallback((ctx: AudioContext, vol: number) => {
    const now = ctx.currentTime;
    const notes = [1318.5, 1567.98]; // E6, G6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.025);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.025);
      gain.gain.linearRampToValueAtTime(vol * 0.4, now + idx * 0.025 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.025 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.025);
      osc.stop(now + idx * 0.025 + 0.26);
    });
  }, []);

  // 4. ÂM THANH THÀNH CÔNG / THƯỞNG XP (Success Arpeggio)
  const synthesizeSuccess = useCallback((ctx: AudioContext, vol: number) => {
    const now = ctx.currentTime;
    const chord = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.045);
      gain.gain.linearRampToValueAtTime(vol * 0.35, now + idx * 0.045 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.23);
    });
  }, []);

  // Bộ điều phối phát âm an toàn với tự động resume AudioContext khi có tương tác
  const executeAudio = useCallback(
    (playFn: (ctx: AudioContext, vol: number) => void) => {
      if (typeof window === "undefined") return;
      if (!soundEnabled || soundVolume <= 0) return;

      try {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtxClass) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioCtxClass();
        }

        const ctx = audioCtxRef.current;

        const run = () => {
          try {
            playFn(ctx, soundVolume);
          } catch (e) {
            console.warn("[Sound Engine] Lỗi khi tạo sóng âm:", e);
          }
        };

        if (ctx.state === "suspended") {
          ctx
            .resume()
            .then(() => {
              run();
            })
            .catch(() => {
              run();
            });
        } else {
          run();
        }
      } catch (err) {
        console.warn("[Sound Engine] Lỗi AudioContext:", err);
      }
    },
    [soundEnabled, soundVolume]
  );

  // Phát âm thanh theo preset đã cài đặt (mặc định theo thiết lập ở Settings)
  const playClickSound = useCallback(
    (customPreset?: SoundPreset) => {
      const activePreset = customPreset || soundPreset;

      if (activePreset === "bubble-pop") {
        executeAudio(synthesizeBubblePop);
      } else if (activePreset === "crystal-chime") {
        executeAudio(synthesizeCrystalChime);
      } else {
        // Mặc định: Giọt nước thanh thoát (water-drop)
        executeAudio(synthesizeWaterDrop);
      }
    },
    [soundPreset, executeAudio, synthesizeBubblePop, synthesizeCrystalChime, synthesizeWaterDrop]
  );

  // Phát riêng âm giọt nước
  const playWaterDrop = useCallback(() => {
    executeAudio(synthesizeWaterDrop);
  }, [executeAudio, synthesizeWaterDrop]);

  // Phát âm hoàn thành / thưởng XP
  const playSuccessSound = useCallback(() => {
    executeAudio(synthesizeSuccess);
  }, [executeAudio, synthesizeSuccess]);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        soundVolume,
        soundPreset,
        setSoundEnabled,
        setSoundVolume,
        setSoundPreset,
        playClickSound,
        playWaterDrop,
        playSuccessSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound phải được sử dụng bên trong SoundProvider");
  }
  return context;
}
