import { Track, RoomSettings, UserRole, RoomUser, ChatMessage } from '@/types/room';
import { SAMPLE_TRACKS } from './sampleTracks';
import { getSupabase } from './supabaseClient';

export interface ServerRoom {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  createdAt: number;
  settings: RoomSettings;
  playlist: Track[];
  currentTrackIndex: number;
  playback: {
    isPlaying: boolean;
    startedServerTime: number; // Server epoch when playback started
    pausedAtPosition: number;  // Current playback position in seconds when paused
    updatedAt: number;
    loopMode: 'none' | 'one' | 'all';
  };
  users: Record<string, RoomUser>;
  messages: ChatMessage[];
}

// In-memory global store preserved across serverless route invocations in the Node process
const globalStore = global as unknown as { __harmoniq_rooms?: Map<string, ServerRoom> };
if (!globalStore.__harmoniq_rooms) {
  globalStore.__harmoniq_rooms = new Map<string, ServerRoom>();
}

const rooms = globalStore.__harmoniq_rooms;

// Async persistence to Supabase
async function persistRoomToSupabase(room: ServerRoom) {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('rooms').upsert({
      id: room.id,
      name: room.name,
      description: room.description,
      owner_id: room.ownerId,
      owner_name: room.ownerName,
      settings: room.settings,
      playback: room.playback,
      current_track_index: room.currentTrackIndex,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    // Silent failover to in-memory store
  }
}

// Seed default room if absent
function getOrCreateDefaultRoom(roomId: string): ServerRoom {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      name: roomId === 'chill-lounge' ? 'کافه چیلاکس و آرامش ☕' : `اتاق دورهمی ${roomId}`,
      description: 'پخش آنلاین و هماهنگ موسیقی میزبانی‌شده روی سرور مرکزی',
      ownerId: 'system',
      ownerName: 'سیستم',
      createdAt: Date.now(),
      settings: {
        allowMembersToAddTracks: true,
        allowMembersToControlPlayback: true,
        isPrivate: false,
        chatEnabled: true,
        reactionsEnabled: true,
      },
      playlist: [...SAMPLE_TRACKS],
      currentTrackIndex: 0,
      playback: {
        isPlaying: false,
        startedServerTime: Date.now(),
        pausedAtPosition: 0,
        updatedAt: Date.now(),
        loopMode: 'all',
      },
      users: {},
      messages: [
        {
          id: 'welcome-msg',
          userId: 'system',
          userName: 'سیستم سرور',
          userRole: 'moderator',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HarmoniqServer',
          text: 'به اتاق خوش آمدید! میزبانی موسیقی روی سرور مرکزی انجام می‌شود و با قطع اینترنت هیچ کاربری متوقف نخواهد شد.',
          timestamp: Date.now(),
          isSystem: true,
        },
      ],
    };
    rooms.set(roomId, room);
  }
  return room;
}

/**
 * Calculates current real-time playback position based strictly on server clock.
 * Auto-advances to next track if current track duration has elapsed.
 */
export function getAuthoritativeRoomState(roomId: string): {
  room: ServerRoom;
  calculatedPosition: number;
  serverTime: number;
} {
  const room = getOrCreateDefaultRoom(roomId);
  const now = Date.now();
  let calculatedPosition = room.playback.pausedAtPosition;

  const currentTrack = room.playlist[room.currentTrackIndex];
  const trackDuration = currentTrack ? currentTrack.duration || 180 : 180;

  if (room.playback.isPlaying) {
    const elapsedSeconds = Math.max(0, (now - room.playback.startedServerTime) / 1000);
    calculatedPosition = room.playback.pausedAtPosition + elapsedSeconds;

    // If track finished naturally on server clock, advance to next track automatically
    if (calculatedPosition >= trackDuration && trackDuration > 0) {
      if (room.playback.loopMode === 'one') {
        room.playback.startedServerTime = now;
        room.playback.pausedAtPosition = 0;
        calculatedPosition = 0;
      } else if (room.playlist.length > 0) {
        room.currentTrackIndex = (room.currentTrackIndex + 1) % room.playlist.length;
        room.playback.startedServerTime = now;
        room.playback.pausedAtPosition = 0;
        calculatedPosition = 0;
      } else {
        room.playback.isPlaying = false;
        room.playback.pausedAtPosition = 0;
        calculatedPosition = 0;
      }
      room.playback.updatedAt = now;
    }
  }

  return {
    room,
    calculatedPosition,
    serverTime: now,
  };
}

/**
 * Execute playback control on the server
 */
export function updateRoomPlayback(
  roomId: string,
  action: 'play' | 'pause' | 'seek' | 'next' | 'prev',
  position?: number
): ServerRoom {
  const { room, calculatedPosition } = getAuthoritativeRoomState(roomId);
  const now = Date.now();

  switch (action) {
    case 'play':
      if (!room.playback.isPlaying) {
        room.playback.isPlaying = true;
        room.playback.startedServerTime = now;
        room.playback.pausedAtPosition = typeof position === 'number' ? position : calculatedPosition;
        room.playback.updatedAt = now;
      }
      break;

    case 'pause':
      if (room.playback.isPlaying) {
        room.playback.isPlaying = false;
        room.playback.pausedAtPosition = typeof position === 'number' ? position : calculatedPosition;
        room.playback.updatedAt = now;
      }
      break;

    case 'seek':
      const newPos = Math.max(0, position || 0);
      room.playback.pausedAtPosition = newPos;
      room.playback.startedServerTime = now;
      room.playback.updatedAt = now;
      break;

    case 'next':
      if (room.playlist.length > 0) {
        room.currentTrackIndex = (room.currentTrackIndex + 1) % room.playlist.length;
        room.playback.pausedAtPosition = 0;
        room.playback.startedServerTime = now;
        room.playback.isPlaying = true;
        room.playback.updatedAt = now;
      }
      break;

    case 'prev':
      if (room.playlist.length > 0) {
        room.currentTrackIndex = (room.currentTrackIndex - 1 + room.playlist.length) % room.playlist.length;
        room.playback.pausedAtPosition = 0;
        room.playback.startedServerTime = now;
        room.playback.isPlaying = true;
        room.playback.updatedAt = now;
      }
      break;
  }

  rooms.set(roomId, room);
  persistRoomToSupabase(room);
  return room;
}

/**
 * Add track to server room queue
 */
export function addTrackToRoom(roomId: string, track: Track): ServerRoom {
  const { room } = getAuthoritativeRoomState(roomId);
  room.playlist.push(track);
  rooms.set(roomId, room);
  persistRoomToSupabase(room);
  return room;
}

/**
 * Remove track from server room queue
 */
export function removeTrackFromRoom(roomId: string, trackId: string): ServerRoom {
  const { room } = getAuthoritativeRoomState(roomId);
  room.playlist = room.playlist.filter((t) => t.id !== trackId);
  room.currentTrackIndex = Math.min(room.currentTrackIndex, Math.max(0, room.playlist.length - 1));
  rooms.set(roomId, room);
  persistRoomToSupabase(room);
  return room;
}

/**
 * Reorder tracks in server queue
 */
export function reorderRoomPlaylist(roomId: string, newPlaylist: Track[]): ServerRoom {
  const { room } = getAuthoritativeRoomState(roomId);
  room.playlist = newPlaylist;
  rooms.set(roomId, room);
  persistRoomToSupabase(room);
  return room;
}

/**
 * Register or update active user ping in room
 */
export function touchUserInRoom(roomId: string, user: RoomUser): ServerRoom {
  const { room } = getAuthoritativeRoomState(roomId);
  room.users[user.id] = {
    ...user,
    lastPing: Date.now(),
  };

  // Clean inactive users (no ping in 20s)
  const now = Date.now();
  for (const uid in room.users) {
    if (now - (room.users[uid].lastPing || 0) > 20000 && uid !== room.ownerId) {
      delete room.users[uid];
    }
  }

  rooms.set(roomId, room);
  return room;
}

/**
 * Add chat message to server room
 */
export function addChatMessage(roomId: string, msg: ChatMessage): ServerRoom {
  const { room } = getAuthoritativeRoomState(roomId);
  room.messages.push(msg);
  if (room.messages.length > 100) room.messages.shift();
  rooms.set(roomId, room);
  return room;
}

/**
 * Update user role
 */
export function updateUserRole(roomId: string, userId: string, newRole: UserRole): ServerRoom {
  const { room } = getAuthoritativeRoomState(roomId);
  if (room.users[userId]) {
    room.users[userId].role = newRole;
  }
  rooms.set(roomId, room);
  return room;
}

/**
 * Update room settings
 */
export function updateRoomSettings(roomId: string, settings: RoomSettings): ServerRoom {
  const { room } = getAuthoritativeRoomState(roomId);
  room.settings = { ...room.settings, ...settings };
  rooms.set(roomId, room);
  return room;
}
