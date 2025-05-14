import { useState } from "react";
import { Button } from "./ui/button";
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-between p-4">
      {/* Header */}
      <header className="w-full text-center py-4">
        <h1 className="text-3xl font-bold text-amber-800">
          Tilt-to-Drink Beer
        </h1>
        <p className="text-amber-700">Tilt your device to drink the beer!</p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* Beer glass container */}
        <div className="relative w-full h-[60vh] flex items-center justify-center">
          <BeerGlass beerLevel={beerLevel} isTilting={isTilting} />

          {/* Invisible tilt detector */}
          <TiltDetector onTiltChange={handleTilt} />

          {/* Sound effects player */}
          <SoundEffects soundType={soundType} />
        </div>

        {/* Beer level indicator */}
        <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${beerLevel}%` }}
          ></div>
        </div>
        <p className="text-amber-800 mt-2">
          {beerLevel > 0
            ? `Beer remaining: ${Math.round(beerLevel)}%`
            : "Empty! Time for a refill!"}
        </p>
      </main>

      {/* Footer with refill button */}
      <footer className="w-full py-6 flex justify-center">
        <Button
          onClick={handleRefill}
          className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full text-lg font-medium"
        >
          Refill Beer
        </Button>
      </footer>
    </div>
  );
};

export default Home; 