import { PRESET_AVATARS } from './sampleTracks';

export interface LocalUserProfile {
  id: string;
  name: string;
  avatar: string;
  isCustomAvatar?: boolean;
}

const STORAGE_KEY = 'harmoniq_user_profile';

export function getLocalUserProfile(): LocalUserProfile {
  if (typeof window === 'undefined') {
    return {
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      name: 'مهمان',
      avatar: PRESET_AVATARS[0],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}

  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
  const initial: LocalUserProfile = {
    id: 'user-' + Math.random().toString(36).substring(2, 9),
    name: `کاربر ${randomSuffix}`,
    avatar: randomAvatar,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (_) {}

  return initial;
}

export function saveLocalUserProfile(profile: LocalUserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (_) {}
}

/**
 * Resizes and compresses user-uploaded image from device to lightweight 128x128 avatar.
 */
export function compressAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Center crop square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
