import { PRESET_AVATARS } from './sampleTracks';

export interface LocalUserProfile {
  id: string;
  name: string;
  avatar: string;
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

  // Generate a random pleasant name and avatar
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
