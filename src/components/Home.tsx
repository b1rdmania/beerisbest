import { useState } from "react";
import BeerGlass from "./BeerGlass";
import TiltDetector from "./TiltDetector";
import SoundEffects from "./SoundEffects";

const Home = () => {
  const [beerLevel, setBeerLevel] = useState(100); // 100% full
  const [isTilting, setIsTilting] = useState(false);
  const [soundType, setSoundType] = useState<
    "none" | "gentle" | "heavy" | "gulping" | "pouring"
  >("none");

  // Handle tilt data from the TiltDetector
  const handleTilt = (tiltData: any) => {
    // Calculate tilt angle from beta (front-to-back tilt)
    const tiltAngle = Math.abs(tiltData.beta || 0);
    // Only process tilt if there's beer left
    if (beerLevel > 0) {
      // Determine if the tilt is significant enough to consider "drinking"
      if (tiltAngle > 45) {
        setIsTilting(true);

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
        setIsTilting(false);
        setSoundType("none");
      }
    } else {
      // Beer is empty
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
          <BeerGlass beerLevel={beerLevel} isTilting={isTilting} />

          {/* Invisible tilt detector */}
          <TiltDetector onTiltChange={handleTilt} />

          {/* Sound effects player */}
          <SoundEffects soundType={soundType} />
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