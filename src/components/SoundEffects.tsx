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
  const bgAmbianceRef = useRef<HTMLAudioElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Track if user has interacted with the page
  const [userInteracted, setUserInteracted] = useState(false);

  // Track the last volume level to smooth transitions
  const [lastVolume, setLastVolume] = useState(0);

  // Sound file paths - using glug.mp3 as the only audio file
  const soundPaths = {
    gentle: ['/glug.mp3'],
    heavy: ['/glug.mp3'],
    gulping: ['/glug.mp3'],
    pouring: ['/glug.mp3'],
    ambiance: ['/glug.mp3'],
  };

  // Initialize and preload all audio elements with a single audio file
  useEffect(() => {
    const initAudio = () => {
      // Create all audio elements with the same glug.mp3 file
      gentleRef.current = new Audio(soundPaths.gentle[0]);
      heavyRef.current = new Audio(soundPaths.heavy[0]);
      gulpingRef.current = new Audio(soundPaths.gulping[0]);
      pouringRef.current = new Audio(soundPaths.pouring[0]);
      
      // Add subtle background ambiance using the same audio file
      bgAmbianceRef.current = new Audio(soundPaths.ambiance[0]);
      
      // Configure audio settings with better quality
      [gentleRef, heavyRef, gulpingRef, pouringRef].forEach(ref => {
        if (ref.current) {
          ref.current.volume = 0;
          ref.current.loop = true;
          
          // Higher quality playback settings
          if ('preservesPitch' in ref.current) {
            (ref.current as any).preservesPitch = false;
          }
          
          // Start loading
          ref.current.load();
        }
      });
      
      // Configure background ambiance separately
      if (bgAmbianceRef.current) {
        bgAmbianceRef.current.volume = 0.1; // Very subtle
        bgAmbianceRef.current.loop = true;
        bgAmbianceRef.current.load();
      }
      
      setLoaded(true);
    };
    
    // Only initialize once
    if (!loaded) {
      initAudio();
    }
    
    // Cleanup function
    return () => {
      [gentleRef, heavyRef, gulpingRef, pouringRef, bgAmbianceRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, [loaded, soundPaths]);

  // Function to safely play audio only if user has interacted
  const safePlayAudio = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (!audioRef.current || !userInteracted) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(_ => {
        // Silently catch the error to prevent console warnings
        // We'll try again when user interacts
      });
    }
  };

  // Function to smoothly transition volume with proper type safety and much slower transition
  const applyVolumeTransition = (audioRef: React.RefObject<HTMLAudioElement | null>, targetVolume: number) => {
    if (!audioRef.current) return;
    
    // If audio is playing, transition volume
    if (!audioRef.current.paused) {
      const currentVolume = audioRef.current.volume;
      const volumeDiff = targetVolume - currentVolume;
      
      // Save last target volume for tracking
      setLastVolume(targetVolume);
      
      // Use RAF for smoother transitions
      const startTime = performance.now();
      const duration = 650; // Increased to 650ms for much slower transitions
      
      const fadeAudio = (time: number) => {
        const elapsed = time - startTime;
        const ratio = Math.min(elapsed / duration, 1);
        
        // Use stronger easing function for smoother audio transition
        const easedRatio = easeInOutCubic(ratio);
        
        if (audioRef.current) {
          audioRef.current.volume = currentVolume + volumeDiff * easedRatio;
        }
        
        if (ratio < 1) {
          requestAnimationFrame(fadeAudio);
        }
      };
      
      requestAnimationFrame(fadeAudio);
    } else {
      // If not playing, just set volume directly
      audioRef.current.volume = targetVolume;
      setLastVolume(targetVolume);
    }
  };
  
  // Stronger easing function for even smoother transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // Smooth intensity function to prevent abrupt sound changes
  const getSmoothIntensity = (rawIntensity: number): number => {
    // Apply exponential smoothing for more natural sound volume increases
    // This makes the sound increase more gradually at first, then more rapidly
    return Math.pow(Math.max(0, Math.min(1, rawIntensity)), 1.5);
  };

  // Handle sound playback based on current sound type and tilt intensity with smoother transitions
  useEffect(() => {
    if (!loaded || !userInteracted) return;
    
    // Calculate volume based on tilt intensity (0-1) with extra smoothing for left-right tilt
    const smoothedIntensity = getSmoothIntensity(tiltIntensity);
    
    // Function to stop all sounds with a gentle fade out
    const stopAllSounds = () => {
      [gentleRef, heavyRef, gulpingRef, pouringRef].forEach(ref => {
        if (ref.current && !ref.current.paused) {
          // Fade out
          applyVolumeTransition(ref, 0);
          
          // Stop after fade completes
          setTimeout(() => {
            if (ref.current && !ref.current.paused) {
              ref.current.pause();
              ref.current.currentTime = 0;
            }
          }, 700); // Extended to 700ms for slower fade out
        }
      });
    };
    
    // Adjust background ambient volume based on if other sounds are playing
    if (bgAmbianceRef.current) {
      if (soundType !== "none") {
        applyVolumeTransition(bgAmbianceRef, 0.05); // Lower when other sounds play
      } else {
        applyVolumeTransition(bgAmbianceRef, 0.12); // Higher when no other sounds
      }
      
      // Ensure ambiance is playing if user has interacted
      if (bgAmbianceRef.current.paused && userInteracted) {
        safePlayAudio(bgAmbianceRef);
      }
    }
    
    // Play the appropriate sound with dynamic adjustments based on tilt intensity
    switch(soundType) {
      case "gentle":
        if (gentleRef.current) {
          // Gentle sound volume varies with tilt intensity - even quieter for realism
          const volumeLevel = smoothedIntensity * 0.35; // Gentler sound
          
          if (gentleRef.current.paused) {
            gentleRef.current.volume = volumeLevel * 0.2; // Start even quieter for fade-in effect
            safePlayAudio(gentleRef);
            // Gradually increase to target volume for smoother start
            setTimeout(() => applyVolumeTransition(gentleRef, volumeLevel), 100);
          } else {
            applyVolumeTransition(gentleRef, volumeLevel);
          }
          
          // Adjust playback rate slightly based on tilt intensity - even slower rate
          gentleRef.current.playbackRate = 0.75 + (smoothedIntensity * 0.15);
          
          // Stop other sounds
          [heavyRef, gulpingRef, pouringRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 700);
            }
          });
        }
        break;
      case "heavy":
        if (heavyRef.current) {
          // Heavy sound has more volume range but still quieter overall
          const volumeLevel = smoothedIntensity * 0.55;
          
          if (heavyRef.current.paused) {
            heavyRef.current.volume = volumeLevel * 0.2; // Start even quieter for fade-in effect
            safePlayAudio(heavyRef);
            // Gradually increase to target volume
            setTimeout(() => applyVolumeTransition(heavyRef, volumeLevel), 100);
          } else {
            applyVolumeTransition(heavyRef, volumeLevel);
          }
          
          // Adjust playback rate based on tilt intensity for more realism - even slower
          heavyRef.current.playbackRate = 0.8 + (smoothedIntensity * 0.2);
          
          // Stop other sounds
          [gentleRef, gulpingRef, pouringRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 700);
            }
          });
        }
        break;
      case "gulping":
        if (gulpingRef.current) {
          // Gulping sound is more intense but starts more gradually
          const volumeLevel = 0.2 + (smoothedIntensity * 0.5);
          
          if (gulpingRef.current.paused) {
            gulpingRef.current.volume = volumeLevel * 0.3; // Start even quieter for fade-in effect
            safePlayAudio(gulpingRef);
            // Gradually increase to target volume
            setTimeout(() => applyVolumeTransition(gulpingRef, volumeLevel), 100);
          } else {
            applyVolumeTransition(gulpingRef, volumeLevel);
          }
          
          // Even slower playback rate for gulping
          gulpingRef.current.playbackRate = 0.8 + (smoothedIntensity * 0.3);
          
          // Stop other sounds
          [gentleRef, heavyRef, pouringRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 700);
            }
          });
        }
        break;
      case "pouring":
        if (pouringRef.current) {
          // Pouring is always consistent volume but still smoother transitions
          const volumeLevel = 0.65; // Slightly quieter than before
          
          if (pouringRef.current.paused) {
            pouringRef.current.volume = volumeLevel * 0.4; // Start even quieter for fade-in effect
            safePlayAudio(pouringRef);
            
            // Reset playback to start to ensure we hear the entire pouring sound
            pouringRef.current.currentTime = 0;
            
            // Gradually increase to target volume
            setTimeout(() => applyVolumeTransition(pouringRef, volumeLevel), 150);
          } else {
            applyVolumeTransition(pouringRef, volumeLevel);
          }
          
          // Slower playback rate for pouring
          pouringRef.current.playbackRate = 0.85;
          
          // Stop other sounds
          [gentleRef, heavyRef, gulpingRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 700);
            }
          });
        }
        break;
      case "none":
      default:
        // Fade out and stop all sounds
        stopAllSounds();
        break;
    }
  }, [soundType, tiltIntensity, loaded, lastVolume, userInteracted]);

  // Enable sounds on user interaction (needed for iOS Safari)
  useEffect(() => {
    const enableAudio = () => {
      setUserInteracted(true);
      
      if (bgAmbianceRef.current) {
        bgAmbianceRef.current.volume = 0.12;
        safePlayAudio(bgAmbianceRef);
      }
    };
    
    // Add multiple interaction types to ensure we catch any user interaction
    const interactionEvents = ['click', 'touchstart', 'pointerdown', 'keydown'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, enableAudio, { once: false });
    });
    
    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
  }, [loaded]);

  // This component doesn't render anything visible
  return null;
};

export default SoundEffects; 