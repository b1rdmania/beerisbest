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

  // Enhanced sound file paths with fallbacks
  const soundPaths = {
    gentle: ['/gentle-pour.mp3', '/glug.mp3'],
    heavy: ['/heavy-pour.mp3', '/glug.mp3'],
    gulping: ['/gulping-sound.mp3', '/glug.mp3'],
    pouring: ['/beer-pour.mp3', '/glug.mp3'],
    ambiance: ['/bar-ambiance.mp3', '/ambient.mp3'],
  };

  // Initialize and preload all audio elements with enhanced setup
  useEffect(() => {
    const initAudio = () => {
      // Create all audio elements with fallback paths
      gentleRef.current = new Audio(soundPaths.gentle[0]);
      gentleRef.current.onerror = () => {
        if (gentleRef.current) gentleRef.current.src = soundPaths.gentle[1];
      };
      
      heavyRef.current = new Audio(soundPaths.heavy[0]);
      heavyRef.current.onerror = () => {
        if (heavyRef.current) heavyRef.current.src = soundPaths.heavy[1];
      };
      
      gulpingRef.current = new Audio(soundPaths.gulping[0]);
      gulpingRef.current.onerror = () => {
        if (gulpingRef.current) gulpingRef.current.src = soundPaths.gulping[1];
      };
      
      pouringRef.current = new Audio(soundPaths.pouring[0]);
      pouringRef.current.onerror = () => {
        if (pouringRef.current) pouringRef.current.src = soundPaths.pouring[1];
      };
      
      // Add subtle background ambiance
      bgAmbianceRef.current = new Audio(soundPaths.ambiance[0]);
      bgAmbianceRef.current.onerror = () => {
        if (bgAmbianceRef.current) bgAmbianceRef.current.src = soundPaths.ambiance[1];
      };
      
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
        
        // Auto-play background ambiance (will be muted on iOS until user interaction)
        try {
          bgAmbianceRef.current.play().catch(() => {
            console.log('Background ambiance needs user interaction to play');
          });
        } catch (e) {
          console.log('Could not auto-play ambiance sound');
        }
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

  // Function to smoothly transition volume with proper type safety
  const applyVolumeTransition = (audioRef: React.RefObject<HTMLAudioElement | null>, targetVolume: number) => {
    if (!audioRef.current) return;
    
    // If audio is playing, transition volume
    if (!audioRef.current.paused) {
      const currentVolume = audioRef.current.volume;
      const volumeDiff = targetVolume - currentVolume;
      
      // Use RAF for smoother transitions
      const startTime = performance.now();
      const duration = 200; // ms
      
      const fadeAudio = (time: number) => {
        const elapsed = time - startTime;
        const ratio = Math.min(elapsed / duration, 1);
        
        if (audioRef.current) {
          audioRef.current.volume = currentVolume + volumeDiff * ratio;
        }
        
        if (ratio < 1) {
          requestAnimationFrame(fadeAudio);
        }
      };
      
      requestAnimationFrame(fadeAudio);
    } else {
      // If not playing, just set volume directly
      audioRef.current.volume = targetVolume;
    }
  };

  // Handle sound playback based on current sound type and tilt intensity with smoother transitions
  useEffect(() => {
    if (!loaded) return;
    
    // Calculate volume based on tilt intensity (0-1)
    const adjustedVolume = Math.min(Math.max(tiltIntensity, 0), 1);
    
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
          }, 200);
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
      
      // Ensure ambiance is playing
      if (bgAmbianceRef.current.paused) {
        bgAmbianceRef.current.play().catch(e => console.warn("Ambient audio play failed:", e));
      }
    }
    
    // Play the appropriate sound with dynamic adjustments based on tilt intensity
    switch(soundType) {
      case "gentle":
        if (gentleRef.current) {
          // Gentle sound volume varies with tilt intensity
          const volumeLevel = adjustedVolume * 0.4; // Gentle sound is quieter
          
          if (gentleRef.current.paused) {
            gentleRef.current.volume = volumeLevel;
            gentleRef.current.play().catch(e => console.warn("Audio play failed:", e));
          } else {
            applyVolumeTransition(gentleRef, volumeLevel);
          }
          
          // Adjust playback rate slightly based on tilt intensity
          gentleRef.current.playbackRate = 0.9 + (adjustedVolume * 0.2);
          
          // Stop other sounds
          [heavyRef, gulpingRef, pouringRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 200);
            }
          });
        }
        break;
      case "heavy":
        if (heavyRef.current) {
          // Heavy sound has more volume range
          const volumeLevel = adjustedVolume * 0.65;
          
          if (heavyRef.current.paused) {
            heavyRef.current.volume = volumeLevel;
            heavyRef.current.play().catch(e => console.warn("Audio play failed:", e));
          } else {
            applyVolumeTransition(heavyRef, volumeLevel);
          }
          
          // Adjust playback rate based on tilt intensity for more realism
          heavyRef.current.playbackRate = 0.95 + (adjustedVolume * 0.3);
          
          // Stop other sounds
          [gentleRef, gulpingRef, pouringRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 200);
            }
          });
        }
        break;
      case "gulping":
        if (gulpingRef.current) {
          // Gulping sound is more intense
          const volumeLevel = 0.3 + (adjustedVolume * 0.6);
          
          if (gulpingRef.current.paused) {
            gulpingRef.current.volume = volumeLevel;
            gulpingRef.current.play().catch(e => console.warn("Audio play failed:", e));
          } else {
            applyVolumeTransition(gulpingRef, volumeLevel);
          }
          
          // Higher playback rate for intense gulping
          gulpingRef.current.playbackRate = 1 + (adjustedVolume * 0.4);
          
          // Stop other sounds
          [gentleRef, heavyRef, pouringRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 200);
            }
          });
        }
        break;
      case "pouring":
        if (pouringRef.current) {
          // Pouring is always consistent volume
          const volumeLevel = 0.75; 
          
          if (pouringRef.current.paused) {
            pouringRef.current.volume = volumeLevel;
            pouringRef.current.play().catch(e => console.warn("Audio play failed:", e));
            
            // Reset playback to start to ensure we hear the entire pouring sound
            pouringRef.current.currentTime = 0;
          } else {
            applyVolumeTransition(pouringRef, volumeLevel);
          }
          
          // Normal playback rate for pouring
          pouringRef.current.playbackRate = 1;
          
          // Stop other sounds
          [gentleRef, heavyRef, gulpingRef].forEach(ref => {
            if (ref.current && !ref.current.paused) {
              applyVolumeTransition(ref, 0);
              setTimeout(() => {
                if (ref.current) {
                  ref.current.pause();
                  ref.current.currentTime = 0;
                }
              }, 200);
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
  }, [soundType, tiltIntensity, loaded]);

  // Enable sounds on user interaction (needed for iOS Safari)
  useEffect(() => {
    const enableAudio = () => {
      if (bgAmbianceRef.current && bgAmbianceRef.current.paused) {
        bgAmbianceRef.current.volume = 0.12;
        bgAmbianceRef.current.play().catch(() => {
          console.log('Could not play ambiance sound');
        });
      }
      
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, [loaded]);

  // This component doesn't render anything visible
  return null;
};

export default SoundEffects; 