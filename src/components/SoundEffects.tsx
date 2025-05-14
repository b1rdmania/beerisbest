import React, { useEffect, useRef } from 'react';

type SoundType = "none" | "gentle" | "heavy" | "gulping" | "pouring";

interface SoundEffectsProps {
  soundType: SoundType;
}

const SoundEffects: React.FC<SoundEffectsProps> = ({ soundType }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Placeholder for sound file paths
  const soundMap: Record<SoundType, string | null> = {
    none: null,
    gentle: '/glug.mp3', // Placeholder, might need different sounds
    heavy: '/glug.mp3',  // Placeholder
    gulping: '/glug.mp3',// Placeholder
    pouring: '/glug.mp3', // Placeholder, ideally a pouring sound
  };

  useEffect(() => {
    const soundFile = soundMap[soundType];
    if (audioRef.current && soundFile) {
      if (audioRef.current.src !== window.location.origin + soundFile) {
        audioRef.current.src = soundFile;
      }
      audioRef.current.play().catch(e => console.warn("Audio play failed in SoundEffects:", e));
    } else if (audioRef.current && !soundFile) {
      audioRef.current.pause();
      // audioRef.current.currentTime = 0; // Optional: reset time
    }
  }, [soundType, soundMap]);

  return <audio ref={audioRef} preload="auto" />;
};

export default SoundEffects; 