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

  // Track the last volume level to smooth transitions
  const [lastVolume, setLastVolume] = useState(0);

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
    if (!loaded) return;
    
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
      
      // Ensure ambiance is playing
      if (bgAmbianceRef.current.paused) {
        bgAmbianceRef.current.play().catch(e => console.warn("Ambient audio play failed:", e));
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
            gentleRef.current.play().catch(e => console.warn("Audio play failed:", e));
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
            heavyRef.current.play().catch(e => console.warn("Audio play failed:", e));
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
            gulpingRef.current.play().catch(e => console.warn("Audio play failed:", e));
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
            pouringRef.current.play().catch(e => console.warn("Audio play failed:", e));
            
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
  }, [soundType, tiltIntensity, loaded, lastVolume]);

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