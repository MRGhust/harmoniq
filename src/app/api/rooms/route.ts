import { NextResponse } from 'next/server';
import { RoomData } from '@/types/room';
import { SAMPLE_TRACKS } from '@/lib/sampleTracks';

// In-memory cache for active rooms on this runtime instance
const globalRooms = new Map<string, RoomData>();

// Initialize a public demonstration room if none exists
if (!globalRooms.has('chill-lounge')) {
  globalRooms.set('chill-lounge', {
    id: 'chill-lounge',
    name: 'کافه چیلاکس و آرامش ☕',
    description: 'اتاق همیشگی برای گوش دادن به بیت‌های آرام و ملایم با دوستان',
    ownerId: 'system',
    createdAt: Date.now() - 3600000,
    settings: {
      allowMembersToAddTracks: true,
      allowMembersToControlPlayback: true,
      isPrivate: false,
      chatEnabled: true,
      reactionsEnabled: true,
    },
    playback: {
      currentTrackId: SAMPLE_TRACKS[0].id,
      isPlaying: true,
      currentTime: 15,
      updatedAt: Date.now(),
      playbackRate: 1.0,
      loopMode: 'all',
    },
    playlist: [...SAMPLE_TRACKS],
    currentTrackIndex: 0,
  });
}

export async function GET() {
  const rooms = Array.from(globalRooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    trackCount: r.playlist.length,
    isPrivate: r.settings.isPrivate,
    createdAt: r.createdAt,
    nowPlaying: r.playlist[r.currentTrackIndex]?.title || null,
  }));

  return NextResponse.json({ success: true, rooms });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, isPrivate, password, ownerId, ownerName } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'نام اتاق الزامی است' }, { status: 400 });
    }

    // Generate readable random room ID (e.g. "vibes-491")
    const cleanName = name.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').slice(0, 10);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const roomId = cleanName ? `${cleanName}-${randomSuffix}` : `room-${randomSuffix}`;

    const newRoom: RoomData = {
      id: roomId,
      name: name.trim(),
      description: description?.trim() || 'اتاق اختصاصی گوش دادن گروهی به موسیقی',
      ownerId: ownerId || 'owner-' + Math.random().toString(36).substring(2, 8),
      createdAt: Date.now(),
      settings: {
        allowMembersToAddTracks: true,
        allowMembersToControlPlayback: false, // by default only Host and DJ control
        isPrivate: !!isPrivate,
        password: password || undefined,
        chatEnabled: true,
        reactionsEnabled: true,
      },
      playback: {
        currentTrackId: SAMPLE_TRACKS[0].id,
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now(),
        playbackRate: 1.0,
        loopMode: 'all',
      },
      playlist: [...SAMPLE_TRACKS.slice(0, 3)],
      currentTrackIndex: 0,
    };

    globalRooms.set(roomId, newRoom);

    return NextResponse.json({ success: true, room: newRoom }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
