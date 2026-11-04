'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Track,
  RoomData,
  RoomUser,
  UserRole,
  ChatMessage,
  FloatingReaction,
  RoomSettings,
} from '@/types/room';
import { SAMPLE_TRACKS } from '@/lib/sampleTracks';
import { getLocalUserProfile } from '@/lib/storage';

// Audio Components
import { SynchronizedPlayer } from '@/components/audio/SynchronizedPlayer';
import { AudioVisualizer } from '@/components/audio/AudioVisualizer';
import { LatencyIndicator } from '@/components/audio/LatencyIndicator';

// Room Components
import { RoomHeader } from '@/components/room/RoomHeader';
import { PlaylistQueue } from '@/components/room/PlaylistQueue';
import { RoomChat } from '@/components/room/RoomChat';
import { AddTrackModal } from '@/components/room/AddTrackModal';
import { UserListModal } from '@/components/room/UserListModal';
import { InviteModal } from '@/components/room/InviteModal';
import { EmojiReactions } from '@/components/room/EmojiReactions';
import { RoomSettingsModal } from '@/components/room/RoomSettingsModal';
import { ListMusic, MessageSquare, Radio, Server, CheckCircle2 } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || 'default';

  // Current User
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);

  // Modals & Navigation
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'player' | 'queue' | 'chat'>('player');

  // Latency & Floating Reactions
  const [latencyMs, setLatencyMs] = useState(25);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Room State (Server Authoritative)
  const [room, setRoom] = useState<RoomData>({
    id: roomId,
    name: `اتاق ${roomId}`,
    ownerId: '',
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
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize Local User
  useEffect(() => {
    const profile = getLocalUserProfile();
    const isOwner = roomId.includes(profile.name) || !room.ownerId;
    const initialUser: RoomUser = {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      role: isOwner ? 'host' : 'listener',
      isMuted: false,
      joinedAt: Date.now(),
      latencyMs: 20,
    };
    setCurrentUser(initialUser);
    setUsers([initialUser]);
  }, [roomId]);

  // Server Synchronization Routine (Polls server state every 1.8s)
  const syncWithServer = useCallback(
    async (action?: string, payload?: any) => {
      if (!currentUser) return;

      const t0 = performance.now();
      try {
        const res = await fetch(`/api/rooms/${roomId}/sync`, {
          method: action ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: action ? JSON.stringify({ action, payload, user: currentUser }) : undefined,
        });

        const data = await res.json();
        const rtt = Math.round(performance.now() - t0);
        setLatencyMs(rtt);

        if (data.success && data.room) {
          const sRoom = data.room;
          setRoom((prev) => ({
            ...prev,
            name: sRoom.name || prev.name,
            settings: sRoom.settings || prev.settings,
            playlist: sRoom.playlist || prev.playlist,
            currentTrackIndex: sRoom.currentTrackIndex ?? prev.currentTrackIndex,
            playback: {
              ...prev.playback,
              isPlaying: sRoom.playback.isPlaying,
              currentTime: data.calculatedPosition ?? sRoom.playback.currentTime,
              updatedAt: data.serverTime,
              loopMode: sRoom.playback.loopMode || 'all',
            },
          }));

          if (sRoom.users && Array.isArray(sRoom.users)) {
            setUsers(sRoom.users);
          }

          if (sRoom.messages && Array.isArray(sRoom.messages)) {
            setMessages(sRoom.messages);
          }
        }
      } catch (err) {
        console.warn('Server sync error:', err);
      }
    },
    [roomId, currentUser]
  );

  // Polling Interval for Server State
  useEffect(() => {
    if (!currentUser) return;

    // Initial sync
    syncWithServer();

    // Heartbeat every 2 seconds
    const interval = setInterval(() => {
      syncWithServer('HEARTBEAT');
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, syncWithServer]);

  // Action Dispatchers
  const handlePlayStateChange = (isPlaying: boolean, currentTime: number) => {
    syncWithServer(isPlaying ? 'PLAY' : 'PAUSE', { position: currentTime });
  };

  const handleSeek = (newTime: number) => {
    syncWithServer('SEEK', { position: newTime });
  };

  const handleNextTrack = () => {
    syncWithServer('NEXT_TRACK');
  };

  const handlePrevTrack = () => {
    syncWithServer('PREV_TRACK');
  };

  const handleSelectTrack = (index: number) => {
    syncWithServer('SEEK', { position: 0 });
    setRoom((prev) => ({
      ...prev,
      currentTrackIndex: index,
      playback: { ...prev.playback, isPlaying: true, currentTime: 0 },
    }));
  };

  const handleAddTrack = (trackData: {
    title: string;
    artist: string;
    url: string;
    duration?: number;
    coverUrl?: string;
  }) => {
    const newTrack: Track = {
      id: 'track-' + Math.random().toString(36).substring(2, 9),
      title: trackData.title,
      artist: trackData.artist,
      url: trackData.url,
      duration: trackData.duration || 180,
      coverUrl: trackData.coverUrl,
      addedBy: {
        id: currentUser?.id || 'guest',
        name: currentUser?.name || 'مهمان',
      },
    };
    syncWithServer('ADD_TRACK', { track: newTrack });
  };

  const handleRemoveTrack = (trackId: string) => {
    syncWithServer('REMOVE_TRACK', { trackId });
  };

  const handleReorderPlaylist = (newPlaylist: Track[]) => {
    syncWithServer('REORDER_PLAYLIST', { playlist: newPlaylist });
  };

  const handleSendChatMessage = (text: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      avatar: currentUser.avatar,
      text,
      timestamp: Date.now(),
    };
    syncWithServer('CHAT_MESSAGE', { message: newMsg });
  };

  const handleSendReaction = (emoji: string) => {
    if (!currentUser) return;
    const reactionId = 'react-' + Math.random().toString(36).substring(2, 9);
    setFloatingReactions((prev) => [
      ...prev,
      {
        id: reactionId,
        emoji,
        userName: currentUser.name,
        x: 15 + Math.random() * 70,
      },
    ]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 3500);
  };

  const handleUpdateRole = (targetUserId: string, newRole: UserRole) => {
    syncWithServer('UPDATE_ROLE', { userId: targetUserId, role: newRole });
  };

  const handleSaveSettings = (newSettings: RoomSettings) => {
    syncWithServer('UPDATE_SETTINGS', { settings: newSettings });
  };

  const currentTrack = room.playlist[room.currentTrackIndex] || null;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090a10] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Floating Reactions */}
      <EmojiReactions
        reactions={floatingReactions}
        onSendReaction={handleSendReaction}
        disabled={!room.settings.reactionsEnabled}
        currentUserName={currentUser?.name}
      />

      {/* Top Header */}
      <RoomHeader
        room={room}
        userCount={users.length}
        userRole={currentUser?.role || 'listener'}
        isServerHosted={true}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenUsers={() => setIsUsersOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={() => router.push('/')}
      />

      {/* Main Balanced Flat Grid Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Playlist Queue (4 cols) */}
        <div
          className={`lg:col-span-4 h-full ${
            mobileTab === 'queue' ? 'block' : 'hidden lg:block'
          }`}
        >
          <PlaylistQueue
            playlist={room.playlist}
            currentTrackIndex={room.currentTrackIndex}
            isPlaying={room.playback.isPlaying}
            userRole={currentUser?.role || 'listener'}
            loopMode={room.playback.loopMode}
            allowMembersToAddTracks={room.settings.allowMembersToAddTracks}
            onSelectTrack={handleSelectTrack}
            onOpenAddTrack={() => setIsAddTrackOpen(true)}
            onRemoveTrack={(index) => {
              const track = room.playlist[index];
              if (track) handleRemoveTrack(track.id);
            }}
            onMoveTrack={(fromIndex, toIndex) => {
              if (fromIndex === toIndex) return;
              const next = [...room.playlist];
              const [moved] = next.splice(fromIndex, 1);
              next.splice(toIndex, 0, moved);
              handleReorderPlaylist(next);
            }}
            onClearPlaylist={() => handleReorderPlaylist([])}
            onChangeLoopMode={(mode) => {
              setRoom((prev) => ({
                ...prev,
                playback: { ...prev.playback, loopMode: mode },
              }));
            }}
            onLoadSampleTracks={() => handleReorderPlaylist(SAMPLE_TRACKS)}
          />
        </div>

        {/* Center Column: Flat Synchronized Player & Visualizer (5 cols) */}
        <div
          className={`lg:col-span-5 flex flex-col gap-5 ${
            mobileTab === 'player' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Main Media Player */}
          <SynchronizedPlayer
            currentTrack={currentTrack}
            playback={room.playback}
            userRole={currentUser?.role || 'listener'}
            allowMembersToControl={room.settings.allowMembersToControlPlayback}
            onPlayStateChange={handlePlayStateChange}
            onSeek={handleSeek}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
            loopMode={room.playback.loopMode}
            onChangeLoopMode={(mode) => {
              setRoom((prev) => ({
                ...prev,
                playback: { ...prev.playback, loopMode: mode },
              }));
            }}
          />

          {/* Minimalist Audio Spectrum Visualizer */}
          <div className="flat-card p-4 flex flex-col items-center justify-center gap-2">
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300">طیف فرکانسی زنده (Audio Spectrum)</span>
              <span className="text-[11px] font-mono text-emerald-400">60 FPS</span>
            </div>
            <AudioVisualizer isPlaying={room.playback.isPlaying} />
          </div>

          {/* Server Sync Health Status */}
          <div className="flat-card px-4 py-3 flex items-center justify-between text-xs">
            <LatencyIndicator
              latencyMs={latencyMs}
              isHost={currentUser?.role === 'host'}
              locale="fa"
              onResync={() => syncWithServer()}
            />
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>سرور مرجع: {room.id}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Room Live Chat (3 cols) */}
        <div
          className={`lg:col-span-3 h-full ${
            mobileTab === 'chat' ? 'block' : 'hidden lg:block'
          }`}
        >
          <RoomChat
            messages={messages}
            currentUserId={currentUser?.id || ''}
            isChatEnabled={room.settings.chatEnabled}
            onSendMessage={handleSendChatMessage}
          />
        </div>
      </main>

      {/* Mobile Navigation Dock */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-[#0d0e17] border-t border-[#1c1e2d] px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setMobileTab('player')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            mobileTab === 'player'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>پخش‌کننده</span>
        </button>

        <button
          onClick={() => setMobileTab('queue')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
            mobileTab === 'queue'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>صف ({room.playlist.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
            mobileTab === 'chat'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>چت ({messages.length})</span>
        </button>
      </div>

      {/* Modals */}
      <AddTrackModal
        isOpen={isAddTrackOpen}
        onClose={() => setIsAddTrackOpen(false)}
        onAddTrack={handleAddTrack}
      />

      <UserListModal
        isOpen={isUsersOpen}
        onClose={() => setIsUsersOpen(false)}
        users={users}
        currentUserId={currentUser?.id || ''}
        currentUserRole={currentUser?.role || 'listener'}
        onUpdateRole={handleUpdateRole}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={room.id}
        roomName={room.name}
      />

      <RoomSettingsModal
        isOpen={isSettingsOpen}
        settings={room.settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
