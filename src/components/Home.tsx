import { useState, useEffect } from "react";
import { isIOS } from "react-device-detect";
import BeerGlass from "./BeerGlass";
import TiltDetector from "./TiltDetector";
import SoundEffects from "./SoundEffects";

// TypeScript definition for screen.orientation.lock if not defined
declare global {
  interface ScreenOrientation {
    lock?: (orientation: string) => Promise<void>;
  }
}

const Home = () => {
  const [beerLevel, setBeerLevel] = useState(100); // 100% full
  const [isTilting, setIsTilting] = useState(false);
  const [tiltDirection, setTiltDirection] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canLockScreen, setCanLockScreen] = useState(false);
  const [screenOrientation, setScreenOrientation] = useState<number | null>(null);
  const [soundType, setSoundType] = useState<
    "none" | "gentle" | "heavy" | "gulping" | "pouring"
  >("none");

  // Check if screen orientation API is available
  useEffect(() => {
    setCanLockScreen(!!screen.orientation && typeof (screen.orientation as any).lock === 'function');
    
    // Get initial orientation
    if (window.orientation !== undefined) {
      setScreenOrientation(window.orientation);
    }
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      if (window.orientation !== undefined) {
        setScreenOrientation(window.orientation);
      }
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle fullscreen toggle with iOS compatibility
  const toggleFullscreen = async () => {
    // Check if we're on iOS
    if (isIOS) {
      // iOS doesn't support true fullscreen, but we can try to lock orientation
      if (canLockScreen && (screen.orientation as any).lock) {
        try {
          // Try to lock to the current orientation
          await (screen.orientation as any).lock(
            Math.abs(window.orientation || 0) === 90 ? 'landscape' : 'portrait'
          );
        } catch (error) {
          console.error('Could not lock screen orientation:', error);
        }
      }
      
      // For iOS, we'll just toggle a CSS class that styles like fullscreen
      document.documentElement.classList.toggle('ios-fullscreen');
      setIsFullscreen(!isFullscreen);
    } else {
      // Standard fullscreen API for non-iOS
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => {
          console.error(`Error attempting to enable fullscreen: ${e.message}`);
        });
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    }
  };

  // Update fullscreen state when fullscreen changes externally
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || 
        document.documentElement.classList.contains('ios-fullscreen'));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle tilt data from the TiltDetector with iOS adjustments
  const handleTilt = (tiltData: any) => {
    // Store tilt direction for realistic liquid rendering
    setTiltDirection(tiltData.tiltDirection);
    
    // Calculate beta and gamma for use in conditionals
    const beta = Math.abs(tiltData.beta || 0);
    const gamma = Math.abs(tiltData.gamma || 0);
    
    // Adjust tilting behavior for iOS
    if (isIOS) {
      // iOS needs special handling for the orientation
      const isLandscape = screenOrientation === 90 || screenOrientation === -90;
      
      // Only process tilt if beer remains and device is tilted correctly
      if (beerLevel > 0) {
        // In landscape mode, we need to check different angles
        if (isLandscape) {
          // Only tilt if we're rotated the proper way for drinking
          if ((screenOrientation === 90 && gamma > 45) ||
              (screenOrientation === -90 && gamma > 45)) {
            setIsTilting(true);
            
            // Steeper angles reduce beer faster
            const reductionRate = Math.min(0.5, (gamma - 45) / 90);
            setBeerLevel((prev) => Math.max(0, prev - reductionRate));
            
            // Set sound based on tilt intensity
            setSoundType(gamma > 80 ? "gulping" : gamma > 60 ? "heavy" : "gentle");
          } else {
            setIsTilting(false);
            setSoundType("none");
          }
        } 
        // In portrait mode, use beta (forward tilt)
        else if (tiltData.isTiltedForward) {
          setIsTilting(true);
          
          // Only reduce beer if properly tilted forward
          if (beta > 45) {
            // Reduce beer level based on tilt angle
            const reductionRate = Math.min(0.5, (beta - 45) / 90);
            setBeerLevel((prev) => Math.max(0, prev - reductionRate));
            
            // Set sound effect based on tilt angle
            setSoundType(beta > 80 ? "gulping" : beta > 60 ? "heavy" : "gentle");
          } else {
            setSoundType("none");
          }
        } else {
          setIsTilting(false);
          setSoundType("none");
        }
      } else {
        // Empty beer
        setIsTilting(false);
        setSoundType("none");
      }
    } 
    // Non-iOS devices
    else {
      // Only process tilt if tilted forward and there's beer left
      if (beerLevel > 0 && tiltData.isTiltedForward) {
        setIsTilting(true);

        // Calculate the beta angle for tilt intensity
        const tiltAngle = Math.abs(tiltData.beta || 0);
        
        // Only reduce beer level if properly tilted forward
        if (tiltAngle > 45) {
          // Reduce beer level based on tilt angle
          const reductionRate = Math.min(0.5, (tiltAngle - 45) / 90);
          setBeerLevel((prev) => Math.max(0, prev - reductionRate));

          // Set sound effect based on tilt angle
          setSoundType(tiltAngle > 80 ? "gulping" : tiltAngle > 60 ? "heavy" : "gentle");
        } else {
          setSoundType("none");
        }
      } else {
        // Not tilted enough or beer is empty
        setIsTilting(false);
        setSoundType("none");
      }
    }
  };

  // Handle refill button click
  const handleRefill = () => {
    setBeerLevel(100);
    setSoundType("pouring");

    // Reset sound after pouring animation completes
    setTimeout(() => {
      setSoundType("none");
    }, 2000);
  };

  return (
    <div className={`app-container ${isIOS ? 'ios-app' : ''} ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Main content - Removed header to focus on immersive experience */}
      <main className="main-content premium-layout">
        {/* Beer glass container */}
        <div className={`glass-container ${isIOS ? 'ios-container' : ''}`}>
          <BeerGlass 
            beerLevel={beerLevel} 
            isTilting={isTilting} 
            tiltDirection={tiltDirection}
          />

          {/* Invisible tilt detector */}
          <TiltDetector onTiltChange={handleTilt} />

          {/* Sound effects player */}
          <SoundEffects 
            soundType={soundType} 
            tiltIntensity={isTilting ? Math.min(Math.max((Math.abs(tiltDirection.y) * 2), 0), 1) : 0}
          />

          {/* Fullscreen button - styled differently for iOS */}
          <button
            onClick={toggleFullscreen}
            className={`fullscreen-button ${isIOS ? 'ios-button' : ''}`}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>

        {/* Beer level indicator */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-level"
              style={{ width: `${beerLevel}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {beerLevel > 0
              ? `${Math.round(beerLevel)}%`
              : "Empty! Refill?"}
          </p>
        </div>
      </main>

      {/* Footer with refill button */}
      <footer className="footer">
        <button
          onClick={handleRefill}
          className={`premium-button ${isIOS ? 'ios-premium-button' : ''}`}
        >
          Refill
        </button>
      </footer>
    </div>
  );
};

export default Home; 