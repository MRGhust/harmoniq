import { Track } from '@/types/room';

export const SAMPLE_TRACKS: Track[] = [
  {
    id: 'sample-1',
    title: 'Lofi Midnight Breeze',
    artist: 'Harmoniq Beats',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    duration: 147,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    addedBy: { id: 'system', name: 'Harmoniq System' },
  },
  {
    id: 'sample-2',
    title: 'Synthwave Neon Drive',
    artist: 'Retro Horizon',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=synthwave-80s-110045.mp3',
    duration: 125,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    addedBy: { id: 'system', name: 'Harmoniq System' },
  },
  {
    id: 'sample-3',
    title: 'Chill Cafe Acoustic',
    artist: 'Coffee & Rain',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3',
    duration: 112,
    coverUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=80',
    addedBy: { id: 'system', name: 'Harmoniq System' },
  },
  {
    id: 'sample-4',
    title: 'Ambient Deep Space',
    artist: 'Nebula Sounds',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    duration: 138,
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    addedBy: { id: 'system', name: 'Harmoniq System' },
  },
  {
    id: 'sample-5',
    title: 'Electronic Groove Party',
    artist: 'Pulse Velocity',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77ced.mp3?filename=electronic-future-beats-117997.mp3',
    duration: 110,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    addedBy: { id: 'system', name: 'Harmoniq System' },
  },
];

export const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmic',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aria',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Atlas',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zenith',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Echo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Vibe',
];
