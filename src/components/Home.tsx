import { useState, useEffect } from "react";
import BeerGlass from "./BeerGlass";
import TiltDetector from "./TiltDetector";
import SoundEffects from "./SoundEffects";

const Home = () => {
  const [beerLevel, setBeerLevel] = useState(100); // 100% full
  const [isTilting, setIsTilting] = useState(false);
  const [tiltDirection, setTiltDirection] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundType, setSoundType] = useState<
    "none" | "gentle" | "heavy" | "gulping" | "pouring"
  >("none");

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
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
  };

  // Update fullscreen state when fullscreen changes externally
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle tilt data from the TiltDetector
  const handleTilt = (tiltData: any) => {
    // Store tilt direction for realistic liquid rendering
    setTiltDirection(tiltData.tiltDirection);
    
    // Only process tilt if tilted forward and there's beer left
    if (beerLevel > 0 && tiltData.isTiltedForward) {
      setIsTilting(true);

      // Calculate the beta angle for tilt intensity
      const tiltAngle = Math.abs(tiltData.beta || 0);
      
      // Only reduce beer level if properly tilted forward (not just sideways)
      if (tiltAngle > 45) {
        // Reduce beer level based on tilt angle
        // Steeper angles reduce beer faster
        const reductionRate = Math.min(0.5, (tiltAngle - 45) / 90);
        setBeerLevel((prev) => Math.max(0, prev - reductionRate));

        // Set sound effect based on tilt angle
        if (tiltAngle > 80) {
          setSoundType("gulping");
        } else if (tiltAngle > 60) {
          setSoundType("heavy");
        } else {
          setSoundType("gentle");
        }
      } else {
        setSoundType("none");
      }
    } else {
      // Not tilted enough or beer is empty
      setIsTilting(false);
      setSoundType("none");
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
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>Premium Beer Experience</h1>
        <p>Tilt your device to enjoy our artisanal virtual beer</p>
      </header>

      {/* Main content */}
      <main className="main-content">
        {/* Beer glass container */}
        <div className="glass-container">
          <BeerGlass 
            beerLevel={beerLevel} 
            isTilting={isTilting} 
            tiltDirection={tiltDirection}
          />

          {/* Invisible tilt detector */}
          <TiltDetector onTiltChange={handleTilt} />

          {/* Sound effects player */}
          <SoundEffects soundType={soundType} />

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="fullscreen-button"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
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
              ? `Beer remaining: ${Math.round(beerLevel)}%`
              : "Your glass is empty! Time for a refill."}
          </p>
        </div>
      </main>

      {/* Footer with refill button */}
      <footer className="footer">
        <button
          onClick={handleRefill}
          className="premium-button"
        >
          Refill Beer
        </button>
      </footer>
    </div>
  );
};

export default Home; 