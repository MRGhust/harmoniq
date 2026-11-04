import { NextResponse } from 'next/server';
import { RoomData } from '@/types/room';
import { SAMPLE_TRACKS } from '@/lib/sampleTracks';

// We import the in-memory rooms from the parent route module or keep a shared map
// In serverless, we can provide a default fallback structure if memory reset happens
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const roomId = params.id;

  // Generate deterministic default room if freshly joined
  const defaultRoom: RoomData = {
    id: roomId,
    name: roomId === 'chill-lounge' ? 'کافه چیلاکس و آرامش ☕' : `اتاق دورهمی ${roomId}`,
    description: 'پخش همزمان و هماهنگ موسیقی بدون هیچ تاخیر',
    ownerId: 'system',
    createdAt: Date.now(),
    settings: {
      allowMembersToAddTracks: true,
      allowMembersToControlPlayback: true,
      isPrivate: false,
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
    playlist: [...SAMPLE_TRACKS],
    currentTrackIndex: 0,
  };

  return NextResponse.json({ success: true, room: defaultRoom });
}
