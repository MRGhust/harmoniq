export type UserRole = 'host' | 'dj' | 'moderator' | 'listener';

export interface RoomUser {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  isMuted: boolean;
  joinedAt: number;
  lastPing?: number;
  latencyMs?: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string; // Direct audio URL, uploaded audio Blob URL, or stream
  duration: number; // in seconds
  coverUrl?: string;
  addedBy: {
    id: string;
    name: string;
  };
}

export interface PlaybackState {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number; // in seconds
  updatedAt: number; // timestamp in ms (performance.now or Date.now)
  playbackRate: number; // default 1.0
  loopMode: 'none' | 'one' | 'all';
}

export interface RoomSettings {
  allowMembersToAddTracks: boolean;
  allowMembersToControlPlayback: boolean;
  isPrivate: boolean;
  password?: string;
  chatEnabled: boolean;
  reactionsEnabled: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: number;
  settings: RoomSettings;
  playback: PlaybackState;
  playlist: Track[];
  currentTrackIndex: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  userName: string;
  x: number; // random x percentage for visual effect
}

export type SyncActionType =
  | 'SYNC_STATE'
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'NEXT_TRACK'
  | 'PREV_TRACK'
  | 'ADD_TRACK'
  | 'REMOVE_TRACK'
  | 'REORDER_PLAYLIST'
  | 'USER_JOIN'
  | 'USER_LEAVE'
  | 'USER_KICK'
  | 'UPDATE_USER_ROLE'
  | 'UPDATE_SETTINGS'
  | 'CHAT_MESSAGE'
  | 'REACTION'
  | 'PING'
  | 'PONG';

export interface SyncMessage {
  type: SyncActionType;
  roomId: string;
  senderId: string;
  timestamp: number;
  payload: any;
}
