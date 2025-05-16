import React from 'react';

interface BeerGlassProps {
  beerLevel: number; // Percentage 0-100
  isTilting: boolean; // True if device is tilted significantly
  // TODO: Potentially pass actual tilt angle for more nuanced liquid animation
}

const BeerGlass: React.FC<BeerGlassProps> = ({ beerLevel, isTilting }) => {
  const liquidHeight = Math.max(0, Math.min(100, beerLevel)); // Clamp between 0 and 100

  // Define a simple tilt angle for now when isTilting is true
  // This can be made more sophisticated later by passing the actual device tilt angle
  const tiltAngle = isTilting ? (beerLevel > 0 ? 15 : 0) : 0; // Tilt 15 degrees, or 0 if empty/not tilting

  return (
    <div
      className="beer-glass"
      style={{
        // Simulates a slightly tapered pint glass effect with perspective
        // For a more accurate shape, SVG or complex CSS (clip-path) would be needed.
        // This is a simpler approach for a first pass.
        perspective: '300px',
      }}
    >
      {/* Beer Liquid */}
      <div
        className="beer-liquid"
        style={{
          height: `${liquidHeight}%`,
          transformOrigin: 'bottom center',
          transform: `rotateZ(${tiltAngle}deg)`,
          // Add a slight visual effect to the liquid's top edge when tilted
          borderTop: liquidHeight > 0 && isTilting ? '2px solid rgba(255,220,150,0.7)' : 'none',
          boxShadow: isTilting && liquidHeight > 0 ? 'inset 0px 5px 10px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        {/* Optional: Add some subtle bubble elements here later */}
      </div>

      {/* Optional: Glass highlights/reflections can be added here */}
      {/* e.g., <div className="absolute top-0 left-1/4 w-1/2 h-full bg-white/10 rounded-full blur-md -rotate-45"></div> */}
    </div>
  );
};

export default BeerGlass; 