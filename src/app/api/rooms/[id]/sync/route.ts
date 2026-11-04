import { NextResponse } from 'next/server';
import {
  getAuthoritativeRoomState,
  updateRoomPlayback,
  addTrackToRoom,
  removeTrackFromRoom,
  reorderRoomPlaylist,
  touchUserInRoom,
  addChatMessage,
  updateUserRole,
  updateRoomSettings,
} from '@/lib/serverRoomStore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const roomId = params.id;
  const { room, calculatedPosition, serverTime } = getAuthoritativeRoomState(roomId);

  return NextResponse.json({
    success: true,
    serverTime,
    calculatedPosition,
    room: {
      ...room,
      playback: {
        ...room.playback,
        currentTime: calculatedPosition,
        updatedAt: serverTime,
      },
      users: Object.values(room.users),
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const body = await request.json();
    const { action, payload, user } = body;

    // Register active user heartbeat
    if (user && user.id) {
      touchUserInRoom(roomId, user);
    }

    let updatedRoom;

    switch (action) {
      case 'PLAY':
        updatedRoom = updateRoomPlayback(roomId, 'play', payload?.position);
        break;

      case 'PAUSE':
        updatedRoom = updateRoomPlayback(roomId, 'pause', payload?.position);
        break;

      case 'SEEK':
        updatedRoom = updateRoomPlayback(roomId, 'seek', payload?.position);
        break;

      case 'NEXT_TRACK':
        updatedRoom = updateRoomPlayback(roomId, 'next');
        break;

      case 'PREV_TRACK':
        updatedRoom = updateRoomPlayback(roomId, 'prev');
        break;

      case 'ADD_TRACK':
        if (payload?.track) {
          updatedRoom = addTrackToRoom(roomId, payload.track);
        }
        break;

      case 'REMOVE_TRACK':
        if (payload?.trackId) {
          updatedRoom = removeTrackFromRoom(roomId, payload.trackId);
        }
        break;

      case 'REORDER_PLAYLIST':
        if (payload?.playlist) {
          updatedRoom = reorderRoomPlaylist(roomId, payload.playlist);
        }
        break;

      case 'CHAT_MESSAGE':
        if (payload?.message) {
          updatedRoom = addChatMessage(roomId, payload.message);
        }
        break;

      case 'UPDATE_ROLE':
        if (payload?.userId && payload?.role) {
          updatedRoom = updateUserRole(roomId, payload.userId, payload.role);
        }
        break;

      case 'UPDATE_SETTINGS':
        if (payload?.settings) {
          updatedRoom = updateRoomSettings(roomId, payload.settings);
        }
        break;

      case 'HEARTBEAT':
      default:
        break;
    }

    const { room, calculatedPosition, serverTime } = getAuthoritativeRoomState(roomId);

    return NextResponse.json({
      success: true,
      serverTime,
      calculatedPosition,
      room: {
        ...room,
        playback: {
          ...room.playback,
          currentTime: calculatedPosition,
          updatedAt: serverTime,
        },
        users: Object.values(room.users),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
