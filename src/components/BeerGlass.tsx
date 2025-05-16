import React from 'react';

interface BeerGlassProps {
  beerLevel: number; // Percentage 0-100
  isTilting: boolean; // True if device is tilted significantly
  tiltDirection?: { x: number, y: number }; // Direction of tilt (-1 to 1 for both x and y)
}

const BeerGlass: React.FC<BeerGlassProps> = ({ beerLevel, isTilting, tiltDirection = { x: 0, y: 0 } }) => {
  const liquidHeight = Math.max(0, Math.min(100, beerLevel)); // Clamp between 0 and 100
  
  // Calculate realistic liquid transform based on tilt direction
  // This creates a more realistic effect where the liquid moves based on device orientation
  // When the phone is tilted left/right, the liquid should move accordingly
  const liquidTransform = [];
  
  // Add rotation based on left-right tilt (x-axis)
  if (tiltDirection.x !== 0) {
    liquidTransform.push(`rotateZ(${tiltDirection.x * -15}deg)`); // Tilt left/right up to 15 degrees
  }
  
  // Add a slight skew for more realistic fluid physics when tilted forward
  if (isTilting && tiltDirection.y > 0) {
    // Skew more dramatically when tilted forward more
    liquidTransform.push(`skewX(${tiltDirection.y * -5}deg)`);
  }
  
  // Change the transform-origin based on tilt direction 
  // This makes the liquid appear to move to the opposite side when tilted
  const transformOrigin = isTilting 
    ? `bottom ${tiltDirection.x < 0 ? 'right' : 'left'}`
    : 'bottom center';
  
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
          transformOrigin: transformOrigin,
          transform: liquidTransform.length ? liquidTransform.join(' ') : 'none',
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