export type FocusMusicCategory = 'Nature' | 'Lo-Fi';

export interface MusicTrack {
  id: string;
  name: string;
  assetPath: string;
  iconPath: string;
  category: FocusMusicCategory;
}

export const focusMusicTracks: MusicTrack[] = [
  {
    id: 'lofi_beat',
    name: 'Cozy Lofi Beat',
    assetPath: '/sounds/Focus/Cozy lofi beat.mp3',
    iconPath: '/icons/Music/Cozy lofi beat.png',
    category: 'Lo-Fi',
  },
  {
    id: 'lofi_music',
    name: 'Cozy Lofi Music',
    assetPath: '/sounds/Focus/Cozy lofi music.mp3',
    iconPath: '/icons/Music/Cozy lofi music.png',
    category: 'Lo-Fi',
  },
  {
    id: 'lofi_chill',
    name: 'Good Night Lofi',
    assetPath: '/sounds/Focus/Good Night - Lofi Cozy Chill Music.mp3',
    iconPath: '/icons/Music/Good Night - Lofi Chill.png',
    category: 'Lo-Fi',
  },
  {
    id: 'forest_rain',
    name: 'Ambient Forest Rain',
    assetPath: '/sounds/Focus/Ambient forest rain.mp3',
    iconPath: '/icons/Music/Ambient forest rain.png',
    category: 'Nature',
  },
  {
    id: 'forest_river',
    name: 'Forest River',
    assetPath: '/sounds/Focus/Forest river.mp3',
    iconPath: '/icons/Music/Forest river.png',
    category: 'Nature',
  },
  {
    id: 'flowing_river',
    name: 'Flowing River',
    assetPath: '/sounds/Focus/flowing-river-sounds-blended-with-calming-drone-pads-377064.mp3',
    iconPath: '/icons/Music/flowing-river-sounds.png',
    category: 'Nature',
  },
  {
    id: 'distance',
    name: 'In The Distance',
    assetPath: '/sounds/Focus/In the distance.mp3',
    iconPath: '/icons/Music/In the distance.png',
    category: 'Nature',
  },
  {
    id: 'relax',
    name: 'Relaxing Vibes',
    assetPath: '/sounds/Focus/Relax.mp3',
    iconPath: '/icons/Music/Relax.png',
    category: 'Nature',
  },
];

