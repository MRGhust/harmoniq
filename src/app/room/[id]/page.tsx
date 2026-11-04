'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Track,
  RoomData,
  RoomUser,
  UserRole,
  ChatMessage,
  FloatingReaction,
  RoomSettings,
  SyncMessage,
} from '@/types/room';
import { SAMPLE_TRACKS } from '@/lib/sampleTracks';
import { SyncEngine } from '@/lib/syncEngine';
import { RealtimeManager } from '@/lib/realtimeManager';
import { getLocalUserProfile } from '@/lib/storage';

// Audio Components
import { SynchronizedPlayer } from '@/components/audio/SynchronizedPlayer';
import { AudioVisualizer } from '@/components/audio/AudioVisualizer';
import { VinylCover } from '@/components/audio/VinylCover';
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
import { Music, MessageSquare, ListMusic, Sparkles, Disc, Activity } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || 'default';

  // User Profile
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);

  // Modals & Mobile Tab
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'queue' | 'chat'>('queue');
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'radial'>('bars');

  // Realtime Connection Status & Latency
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  >('connecting');
  const [latencyMs, setLatencyMs] = useState(24);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Room State
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

  // Singletons
  const syncEngine = useMemo(() => new SyncEngine(), []);
  const realtimeRef = useRef<RealtimeManager | null>(null);

  // Initialize User Profile
  useEffect(() => {
    const profile = getLocalUserProfile();
    // Deterministic host election: first visitor or owner
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

  // Handle incoming real-time network messages
  const handleIncomingMessage = useCallback(
    (msg: SyncMessage) => {
      switch (msg.type) {
        case 'SYNC_STATE': {
          if (msg.payload?.room) {
            setRoom((prev) => ({
              ...prev,
              ...msg.payload.room,
              // Keep local index safe
              currentTrackIndex: Math.min(
                msg.payload.room.currentTrackIndex || 0,
                (msg.payload.room.playlist || []).length - 1
              ),
            }));
          }
          if (msg.payload?.users) {
            setUsers(msg.payload.users);
          }
          break;
        }

        case 'PLAY': {
          setRoom((prev) => ({
            ...prev,
            playback: {
              ...prev.playback,
              isPlaying: true,
              currentTime: msg.payload.currentTime,
              updatedAt: msg.timestamp,
            },
          }));
          break;
        }

        case 'PAUSE': {
          setRoom((prev) => ({
            ...prev,
            playback: {
              ...prev.playback,
              isPlaying: false,
              currentTime: msg.payload.currentTime,
              updatedAt: msg.timestamp,
            },
          }));
          break;
        }

        case 'SEEK': {
          setRoom((prev) => ({
            ...prev,
            playback: {
              ...prev.playback,
              currentTime: msg.payload.currentTime,
              updatedAt: msg.timestamp,
            },
          }));
          break;
        }

        case 'NEXT_TRACK':
        case 'PREV_TRACK': {
          const nextIndex = msg.payload.nextIndex;
          setRoom((prev) => {
            const track = prev.playlist[nextIndex];
            return {
              ...prev,
              currentTrackIndex: nextIndex,
              playback: {
                ...prev.playback,
                currentTrackId: track ? track.id : null,
                currentTime: 0,
                isPlaying: true,
                updatedAt: Date.now(),
              },
            };
          });
          break;
        }

        case 'ADD_TRACK': {
          const newTrack = msg.payload.track as Track;
          setRoom((prev) => ({
            ...prev,
            playlist: [...prev.playlist, newTrack],
          }));
          // Add system message
          addSystemMessage(`${msg.payload.userName || 'کاربری'} آهنگ "${newTrack.title}" را به صف اضافه کرد.`);
          break;
        }

        case 'REMOVE_TRACK': {
          const trackId = msg.payload.trackId;
          setRoom((prev) => {
            const nextList = prev.playlist.filter((t) => t.id !== trackId);
            return {
              ...prev,
              playlist: nextList,
              currentTrackIndex: Math.min(prev.currentTrackIndex, Math.max(0, nextList.length - 1)),
            };
          });
          break;
        }

        case 'REORDER_PLAYLIST': {
          if (msg.payload.playlist) {
            setRoom((prev) => ({
              ...prev,
              playlist: msg.payload.playlist,
            }));
          }
          break;
        }

        case 'USER_JOIN': {
          const newUserId = msg.senderId;
          const newUserName = msg.payload.name || 'کاربر جدید';
          const newUserAvatar = msg.payload.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${newUserId}`;
          setUsers((prev) => {
            if (prev.some((u) => u.id === newUserId)) return prev;
            return [
              ...prev,
              {
                id: newUserId,
                name: newUserName,
                avatar: newUserAvatar,
                role: 'listener',
                isMuted: false,
                joinedAt: Date.now(),
                latencyMs: 30,
              },
            ];
          });
          addSystemMessage(`${newUserName} وارد اتاق شد 👋`);

          // If current user is host, send current state snapshot
          if (currentUser?.role === 'host') {
            realtimeRef.current?.send({
              type: 'SYNC_STATE',
              roomId,
              senderId: currentUser.id,
              timestamp: Date.now(),
              payload: { room, users },
            });
          }
          break;
        }

        case 'USER_KICK': {
          if (msg.payload.targetUserId === currentUser?.id) {
            alert('شما توسط میزبان از اتاق اخراج شدید.');
            router.push('/');
          } else {
            setUsers((prev) => prev.filter((u) => u.id !== msg.payload.targetUserId));
            addSystemMessage(`${msg.payload.targetUserName || 'یک کاربر'} از اتاق اخراج شد.`);
          }
          break;
        }

        case 'UPDATE_USER_ROLE': {
          const { targetUserId, newRole } = msg.payload;
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
          );
          if (targetUserId === currentUser?.id) {
            setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
          }
          break;
        }

        case 'UPDATE_SETTINGS': {
          if (msg.payload.settings) {
            setRoom((prev) => ({ ...prev, settings: msg.payload.settings }));
            addSystemMessage('تنظیمات اتاق توسط میزبان به‌روزرسانی شد.');
          }
          break;
        }

        case 'CHAT_MESSAGE': {
          const chatMsg = msg.payload as ChatMessage;
          setMessages((prev) => [...prev, chatMsg]);
          break;
        }

        case 'REACTION': {
          const { emoji, userName } = msg.payload;
          const reactionId = 'react-' + Math.random().toString(36).substring(2, 9);
          setFloatingReactions((prev) => [
            ...prev,
            {
              id: reactionId,
              emoji,
              userName,
              x: 10 + Math.random() * 80,
            },
          ]);
          // Clean up floating after 4s
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
          }, 4000);
          break;
        }

        case 'PING': {
          // Respond with PONG
          realtimeRef.current?.send({
            type: 'PONG',
            roomId,
            senderId: currentUser?.id || 'guest',
            timestamp: Date.now(),
            payload: { clientSendTime: msg.payload.clientSendTime, hostTime: Date.now() },
          });
          break;
        }

        case 'PONG': {
          const clientSendTime = msg.payload.clientSendTime;
          const hostTime = msg.payload.hostTime;
          const now = performance.now();
          syncEngine.recordPingPong(clientSendTime, hostTime, now);
          setLatencyMs(syncEngine.getLatency());
          break;
        }

        default:
          break;
      }
    },
    [currentUser, roomId, room, users, syncEngine, router]
  );

  // Initialize Realtime Manager
  useEffect(() => {
    if (!currentUser) return;

    const rt = new RealtimeManager({
      roomId,
      userId: currentUser.id,
      userName: currentUser.name,
      isHost: currentUser.role === 'host',
      onMessage: handleIncomingMessage,
      onStatusChange: (status) => setConnectionStatus(status),
    });

    realtimeRef.current = rt;

    return () => {
      rt.destroy();
    };
  }, [currentUser?.id, roomId]);

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: 'sys-' + Math.random().toString(36).substring(2, 9),
        userId: 'system',
        userName: 'سیستم',
        userRole: 'moderator',
        avatar: '',
        text,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  };

  // Playback Action Handlers
  const currentTrack = room.playlist[room.currentTrackIndex] || null;

  const handlePlayStateChange = (isPlaying: boolean, currentTime: number) => {
    const updated = {
      ...room.playback,
      isPlaying,
      currentTime,
      updatedAt: Date.now(),
    };
    setRoom((prev) => ({ ...prev, playback: updated }));

    realtimeRef.current?.send({
      type: isPlaying ? 'PLAY' : 'PAUSE',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { currentTime },
    });
  };

  const handleSeek = (newTime: number) => {
    setRoom((prev) => ({
      ...prev,
      playback: {
        ...prev.playback,
        currentTime: newTime,
        updatedAt: Date.now(),
      },
    }));

    realtimeRef.current?.send({
      type: 'SEEK',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { currentTime: newTime },
    });
  };

  const handleNextTrack = () => {
    if (room.playlist.length === 0) return;
    const nextIndex = (room.currentTrackIndex + 1) % room.playlist.length;
    setRoom((prev) => ({
      ...prev,
      currentTrackIndex: nextIndex,
      playback: {
        ...prev.playback,
        currentTrackId: prev.playlist[nextIndex]?.id || null,
        currentTime: 0,
        isPlaying: true,
        updatedAt: Date.now(),
      },
    }));

    realtimeRef.current?.send({
      type: 'NEXT_TRACK',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { nextIndex },
    });
  };

  const handlePrevTrack = () => {
    if (room.playlist.length === 0) return;
    const prevIndex =
      (room.currentTrackIndex - 1 + room.playlist.length) % room.playlist.length;
    setRoom((prev) => ({
      ...prev,
      currentTrackIndex: prevIndex,
      playback: {
        ...prev.playback,
        currentTrackId: prev.playlist[prevIndex]?.id || null,
        currentTime: 0,
        isPlaying: true,
        updatedAt: Date.now(),
      },
    }));

    realtimeRef.current?.send({
      type: 'PREV_TRACK',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { nextIndex: prevIndex },
    });
  };

  const handleSelectTrack = (index: number) => {
    if (index < 0 || index >= room.playlist.length) return;
    setRoom((prev) => ({
      ...prev,
      currentTrackIndex: index,
      playback: {
        ...prev.playback,
        currentTrackId: prev.playlist[index]?.id || null,
        currentTime: 0,
        isPlaying: true,
        updatedAt: Date.now(),
      },
    }));

    realtimeRef.current?.send({
      type: 'NEXT_TRACK',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { nextIndex: index },
    });
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

    setRoom((prev) => ({
      ...prev,
      playlist: [...prev.playlist, newTrack],
    }));

    realtimeRef.current?.send({
      type: 'ADD_TRACK',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { track: newTrack, userName: currentUser?.name },
    });

    addSystemMessage(`شما آهنگ "${newTrack.title}" را به صف اضافه کردید.`);
  };

  const handleRemoveTrack = (trackId: string) => {
    setRoom((prev) => {
      const nextList = prev.playlist.filter((t) => t.id !== trackId);
      return {
        ...prev,
        playlist: nextList,
        currentTrackIndex: Math.min(prev.currentTrackIndex, Math.max(0, nextList.length - 1)),
      };
    });

    realtimeRef.current?.send({
      type: 'REMOVE_TRACK',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { trackId },
    });
  };

  const handleReorderPlaylist = (newPlaylist: Track[]) => {
    setRoom((prev) => ({ ...prev, playlist: newPlaylist }));
    realtimeRef.current?.send({
      type: 'REORDER_PLAYLIST',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { playlist: newPlaylist },
    });
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

    setMessages((prev) => [...prev, newMsg]);

    realtimeRef.current?.send({
      type: 'CHAT_MESSAGE',
      roomId,
      senderId: currentUser.id,
      timestamp: Date.now(),
      payload: newMsg,
    });
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

    realtimeRef.current?.send({
      type: 'REACTION',
      roomId,
      senderId: currentUser.id,
      timestamp: Date.now(),
      payload: { emoji, userName: currentUser.name },
    });

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 4000);
  };

  const handleUpdateRole = (targetUserId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
    );

    realtimeRef.current?.send({
      type: 'UPDATE_USER_ROLE',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { targetUserId, newRole },
    });
  };

  const handleKickUser = (targetUserId: string) => {
    const target = users.find((u) => u.id === targetUserId);
    setUsers((prev) => prev.filter((u) => u.id !== targetUserId));

    realtimeRef.current?.send({
      type: 'USER_KICK',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { targetUserId, targetUserName: target?.name },
    });
  };

  const handleSaveSettings = (newSettings: RoomSettings) => {
    setRoom((prev) => ({ ...prev, settings: newSettings }));

    realtimeRef.current?.send({
      type: 'UPDATE_SETTINGS',
      roomId,
      senderId: currentUser?.id || '',
      timestamp: Date.now(),
      payload: { settings: newSettings },
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-slate-950">
      {/* Floating Emoji Reactions Layer */}
      <EmojiReactions
        reactions={floatingReactions}
        onSendReaction={handleSendReaction}
        disabled={!room.settings.reactionsEnabled}
        currentUserName={currentUser?.name}
      />

      {/* Header */}
      <RoomHeader
        room={room}
        userCount={users.length}
        userRole={currentUser?.role || 'listener'}
        connectionStatus={connectionStatus}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenUsers={() => setIsUsersOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={() => router.push('/')}
      />

      {/* Main Room Body */}
      <main className="max-w-7xl mx-auto w-full px-3 md:px-6 py-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column / Mobile Switchable: Playlist Queue */}
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

        {/* Center Column: Vinyl Artwork, Visualizer, & Synchronized Audio Player */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4 w-full">
          {/* Vinyl & Visualizer Interactive Showcase Card */}
          <div className="w-full glass-panel rounded-3xl p-5 md:p-6 border border-white/10 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
            {/* Visualizer Mode Toggle Pill */}
            <div className="w-full flex items-center justify-between mb-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-white">صفحه پخش نئونی</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
                {(['bars', 'wave', 'radial'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVisualizerMode(m)}
                    className={`px-2 py-0.5 rounded-lg capitalize transition text-[11px] ${
                      visualizerMode === m
                        ? 'bg-purple-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m === 'bars' ? 'میله‌ای' : m === 'wave' ? 'موجی' : 'دایره‌ای'}
                  </button>
                ))}
              </div>
            </div>

            {/* Vinyl Record Display */}
            <div className="my-2">
              <VinylCover
                coverUrl={currentTrack?.coverUrl}
                isPlaying={room.playback.isPlaying}
                title={currentTrack?.title}
              />
            </div>

            {/* Canvas Audio Visualizer */}
            <div className="w-full h-24 md:h-28 mt-2">
              <AudioVisualizer
                mode={visualizerMode}
                isPlaying={room.playback.isPlaying}
              />
            </div>
          </div>

          {/* Synchronized Player */}
          <SynchronizedPlayer
            currentTrack={currentTrack}
            playback={room.playback}
            userRole={currentUser?.role || 'listener'}
            allowMembersToControl={room.settings.allowMembersToControlPlayback}
            syncEngine={syncEngine}
            onPlayStateChange={handlePlayStateChange}
            onSeek={handleSeek}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
          />

          {/* Latency & Sync Health Bar */}
          <div className="w-full flex items-center justify-between px-1">
            <LatencyIndicator
              latencyMs={latencyMs}
              isHost={currentUser?.role === 'host'}
              locale="fa"
              onResync={() => {
                if (currentTrack) {
                  handleSeek(room.playback.currentTime);
                }
              }}
            />
            <span className="text-[11px] text-slate-500 font-mono">
              اتاق: {room.id}
            </span>
          </div>
        </div>

        {/* Right Column / Mobile Switchable: Room Chat */}
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

      {/* Mobile Tab Navigation Bar */}
      <div className="lg:hidden sticky bottom-0 z-30 glass-panel border-t border-white/10 px-4 py-2 flex items-center justify-around bg-slate-950/90">
        <button
          onClick={() => setMobileTab('queue')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition ${
            mobileTab === 'queue'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>صف پخش ({room.playlist.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition ${
            mobileTab === 'chat'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>گفتگوی زنده ({messages.length})</span>
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
        onKickUser={handleKickUser}
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
