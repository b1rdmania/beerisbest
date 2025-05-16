import React, { useEffect, useRef, useState } from 'react';

type SoundType = "none" | "gentle" | "heavy" | "gulping" | "pouring";

interface SoundEffectsProps {
  soundType: SoundType;
  tiltIntensity?: number; // 0-1 value representing tilt intensity
}

const SoundEffects: React.FC<SoundEffectsProps> = ({ soundType, tiltIntensity = 0.5 }) => {
  // Separate audio element refs for different sound types
  const gentleRef = useRef<HTMLAudioElement | null>(null);
  const heavyRef = useRef<HTMLAudioElement | null>(null);
  const gulpingRef = useRef<HTMLAudioElement | null>(null);
  const pouringRef = useRef<HTMLAudioElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Sound file paths
  const soundPaths = {
    gentle: '/glug.mp3',
    heavy: '/glug.mp3',
    gulping: '/glug.mp3',
    pouring: '/glug.mp3',
  };

  // Initialize and preload all audio elements
  useEffect(() => {
    const initAudio = () => {
      // Create all audio elements
      gentleRef.current = new Audio(soundPaths.gentle);
      heavyRef.current = new Audio(soundPaths.heavy);
      gulpingRef.current = new Audio(soundPaths.gulping);
      pouringRef.current = new Audio(soundPaths.pouring);
      
      // Configure audio settings
      [gentleRef, heavyRef, gulpingRef, pouringRef].forEach(ref => {
        if (ref.current) {
          ref.current.volume = 0;
          ref.current.loop = true;
          
          // Start loading
          ref.current.load();
        }
      });
      
      setLoaded(true);
    };
    
    // Only initialize once
    if (!loaded) {
      initAudio();
    }
    
    // Cleanup function
    return () => {
      [gentleRef, heavyRef, gulpingRef, pouringRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, [loaded, soundPaths]);

  // Handle sound playback based on current sound type and tilt intensity
  useEffect(() => {
    if (!loaded) return;
    
    // Calculate volume based on tilt intensity (0-1)
    const adjustedVolume = Math.min(Math.max(tiltIntensity, 0), 1);
    
    // Function to stop all sounds
    const stopAllSounds = () => {
      [gentleRef, heavyRef, gulpingRef, pouringRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
    
    // First stop all sounds
    stopAllSounds();
    
    // Play the appropriate sound
    switch(soundType) {
      case "gentle":
        if (gentleRef.current) {
          gentleRef.current.volume = adjustedVolume * 0.4; // Gentle sound is quieter
          gentleRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }
        break;
      case "heavy":
        if (heavyRef.current) {
          heavyRef.current.volume = adjustedVolume * 0.6;
          heavyRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }
        break;
      case "gulping":
        if (gulpingRef.current) {
          gulpingRef.current.volume = adjustedVolume * 0.8;
          gulpingRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }
        break;
      case "pouring":
        if (pouringRef.current) {
          pouringRef.current.volume = 0.7; // Pouring is always the same volume
          pouringRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }
        break;
      case "none":
      default:
        // No sound playing
        break;
    }
  }, [soundType, tiltIntensity, loaded]);

  // This component doesn't render anything visible
  return null;
};

export default SoundEffects; 