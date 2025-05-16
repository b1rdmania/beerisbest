import React, { useRef, useEffect } from 'react';
import { isIOS } from 'react-device-detect';

interface BeerGlassProps {
  beerLevel: number; // Percentage 0-100
  isTilting: boolean; // True if device is tilted significantly
  tiltDirection?: { x: number, y: number }; // Direction of tilt (-1 to 1 for both x and y)
}

const BeerGlass: React.FC<BeerGlassProps> = ({ beerLevel, isTilting, tiltDirection = { x: 0, y: 0 } }) => {
  const liquidRef = useRef<HTMLDivElement>(null);
  const liquidHeight = Math.max(0, Math.min(100, beerLevel)); // Clamp between 0 and 100
  
  // Adjust tilt values for iOS specifically
  const adjustedTiltDirection = {
    x: isIOS ? tiltDirection.x * 1.2 : tiltDirection.x, // Amplify a bit on iOS
    y: isIOS ? tiltDirection.y * 1.2 : tiltDirection.y,
  };
  
  // Calculate realistic liquid transform based on tilt direction
  const calculateLiquidStyle = () => {
    // Create an array to hold our transform values
    const transforms = [];
    
    // Add rotation based on left-right tilt (x-axis)
    if (adjustedTiltDirection.x !== 0) {
      // Apply a more pronounced effect for iOS
      transforms.push(`rotateZ(${adjustedTiltDirection.x * -20}deg)`);
    }
    
    // Add a skew for more realistic fluid physics when tilted forward
    if (isTilting && adjustedTiltDirection.y > 0) {
      // iOS needs a more dramatic skew
      const skewAmount = isIOS ? -8 : -5;
      transforms.push(`skewX(${adjustedTiltDirection.y * skewAmount}deg)`);
    }
    
    // For iOS, add a slight perspective transform
    if (isIOS) {
      transforms.push(`perspective(500px)`);
      if (isTilting) {
        transforms.push(`rotateX(${adjustedTiltDirection.y * 5}deg)`);
      }
    }
    
    return {
      height: `${liquidHeight}%`,
      transformOrigin: getTransformOrigin(),
      transform: transforms.length ? transforms.join(' ') : 'none',
      // Add a slight visual effect to the liquid's top edge when tilted
      borderTop: liquidHeight > 0 && isTilting ? '2px solid rgba(255,220,150,0.7)' : 'none',
      boxShadow: isTilting && liquidHeight > 0 ? 'inset 0px 5px 10px rgba(0,0,0,0.2)' : 'none',
      // Use hardware acceleration for better performance on iOS
      WebkitTransform: transforms.length ? transforms.join(' ') : 'none',
      WebkitBackfaceVisibility: 'hidden',
    };
  };
  
  // Calculate the transform origin based on tilt direction
  const getTransformOrigin = () => {
    if (!isTilting) return 'bottom center';
    
    // For iOS, use a different transform origin calculation
    if (isIOS) {
      const xPosition = adjustedTiltDirection.x < 0 ? 'right' : 'left';
      // For extreme tilts, shift the origin point more
      if (Math.abs(adjustedTiltDirection.x) > 0.7) {
        return `bottom ${xPosition} -20%`;
      }
      return `bottom ${xPosition}`;
    }
    
    // For non-iOS
    return `bottom ${adjustedTiltDirection.x < 0 ? 'right' : 'left'}`;
  };
  
  // Reset animation when tilt changes (for iOS Safari)
  useEffect(() => {
    if (isIOS && liquidRef.current) {
      // Force repaint on iOS by toggling a class
      liquidRef.current.classList.remove('ios-animating');
      // Small delay to ensure DOM updates
      setTimeout(() => {
        if (liquidRef.current) {
          liquidRef.current.classList.add('ios-animating');
        }
      }, 10);
    }
  }, [isTilting, JSON.stringify(tiltDirection)]);
  
  return (
    <div
      className={`beer-glass ${isIOS ? 'ios-glass' : ''}`}
      style={{
        perspective: '300px',
        WebkitPerspective: '300px', // For iOS
      }}
    >
      {/* Beer Liquid */}
      <div
        ref={liquidRef}
        className={`beer-liquid ${isIOS ? 'ios-liquid' : ''} ${isTilting ? 'tilting' : ''}`}
        style={calculateLiquidStyle()}
      >
        {/* iOS-specific bubbles for better visual feedback */}
        {isIOS && (
          <div className="ios-bubbles">
            <div className="bubble bubble-1"></div>
            <div className="bubble bubble-2"></div>
            <div className="bubble bubble-3"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeerGlass; 