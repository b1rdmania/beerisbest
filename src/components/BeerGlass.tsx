import React, { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { isIOS } from 'react-device-detect';

interface BeerGlassProps {
  beerLevel: number; // Percentage 0-100
  isTilting: boolean; // True if device is tilted significantly
  tiltDirection?: { x: number, y: number }; // Direction of tilt (-1 to 1 for both x and y)
}

interface LiquidStyle extends CSSProperties {
  WebkitTransform?: string;
  WebkitBackfaceVisibility?: 'hidden' | 'visible';
}

const BeerGlass: React.FC<BeerGlassProps> = ({ beerLevel, isTilting, tiltDirection = { x: 0, y: 0 } }) => {
  const liquidRef = useRef<HTMLDivElement>(null);
  const foamRef = useRef<HTMLDivElement>(null);
  const liquidHeight = Math.max(0, Math.min(100, beerLevel)); // Clamp between 0 and 100
  const [bubbles, setBubbles] = useState<Array<{id: number, left: string, delay: string, size: string}>>([]);
  const [condensation, setCondensation] = useState<Array<{id: number, left: string, top: string, size: string, delay: string}>>([]);
  
  // Generate random bubbles on component mount
  useEffect(() => {
    // Create some random bubbles
    const newBubbles = Array(8).fill(0).map((_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 3}s`,
      size: `${4 + Math.random() * 8}px`
    }));
    setBubbles(newBubbles);
    
    // Create condensation droplets
    const newDrops = Array(15).fill(0).map((_, i) => ({
      id: i,
      left: `${Math.random() * 90}%`,
      top: `${10 + Math.random() * 80}%`,
      size: `${2 + Math.random() * 5}px`,
      delay: `${Math.random() * 5}s`
    }));
    setCondensation(newDrops);
  }, []);
  
  // Adjust tilt values for iOS specifically
  const adjustedTiltDirection = {
    x: isIOS ? tiltDirection.x * 1.2 : tiltDirection.x, // Amplify a bit on iOS
    y: isIOS ? tiltDirection.y * 1.2 : tiltDirection.y,
  };
  
  // Enhanced liquid physics calculation
  const calculateLiquidStyle = (): LiquidStyle => {
    // Calculate tilt angle from direction vectors
    const tiltAngle = isTilting ? Math.max(0, adjustedTiltDirection.y * 90) : 0;
    const sideAngle = adjustedTiltDirection.x * 25; // Left-right tilt angle
    
    // Calculate liquid shift based on tilt
    const tiltOffset = Math.min(30, (tiltAngle / 90) * 50);
    const shiftX = tiltAngle > 30 ? `${adjustedTiltDirection.x * tiltOffset}%` : "0%";
    
    // Create transform array with enhanced physics
    const transforms = [];
    
    // Base rotation from left-right tilt
    transforms.push(`rotateZ(${sideAngle}deg)`);
    
    // Add tilt-based transforms for more realistic fluid
    if (tiltAngle > 0) {
      // More dramatic transform when significantly tilted
      if (tiltAngle > 30) {
        transforms.push(`translateX(${shiftX})`);
      }
      
      // Add skew for realism
      transforms.push(`skewX(${-adjustedTiltDirection.y * 5}deg)`);
    }
    
    // Determine transform origin based on tilt direction and angle
    const transformOrigin = tiltAngle > 30 
      ? `bottom ${adjustedTiltDirection.x < 0 ? 'right' : 'left'}`
      : 'bottom center';
    
    return {
      height: `${liquidHeight}%`,
      transformOrigin: transformOrigin,
      transform: transforms.length ? transforms.join(' ') : 'none',
      transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      // Add a slight visual effect to the liquid's top edge when tilted
      borderTop: liquidHeight > 0 && isTilting ? '2px solid rgba(255,220,150,0.7)' : 'none',
      boxShadow: isTilting && liquidHeight > 0 ? 'inset 0px 5px 10px rgba(0,0,0,0.2)' : 'none',
      // Use hardware acceleration for better performance on iOS
      WebkitTransform: transforms.length ? transforms.join(' ') : 'none',
      WebkitBackfaceVisibility: 'hidden',
    };
  };
  
  // Slightly different physics for the foam to move more independently
  const calculateFoamStyle = (): CSSProperties => {
    const sideAngle = adjustedTiltDirection.x * 15; // Less dramatic than liquid
    const transforms = [];
    
    transforms.push(`rotateZ(${sideAngle * 0.7}deg)`); // Foam moves less than liquid
    
    // Foam should follow the liquid but with a lag/dampened effect
    if (isTilting && adjustedTiltDirection.y > 0) {
      transforms.push(`translateX(${adjustedTiltDirection.x * 5}%)`);
    }
    
    return {
      transform: transforms.length ? transforms.join(' ') : 'none',
      transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)', // Slower than liquid
      WebkitTransform: transforms.length ? transforms.join(' ') : 'none',
    };
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
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Condensation drops on glass exterior */}
      {condensation.map(drop => (
        <div
          key={`drop-${drop.id}`}
          className="condensation-drop"
          style={{
            position: 'absolute',
            left: drop.left,
            top: drop.top,
            width: drop.size,
            height: drop.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            filter: 'blur(1px)',
            zIndex: 3,
            animation: `droplet-fall 10s linear ${drop.delay} infinite`
          }}
        />
      ))}
      
      {/* Glass shine effect */}
      <div
        className="glass-shine"
        style={{
          position: 'absolute',
          top: '5%',
          left: '15%',
          width: '20%',
          height: '90%',
          background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
          borderRadius: '50% / 30%',
          transform: 'rotate(-10deg)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
      
      {/* Beer Liquid */}
      <div
        ref={liquidRef}
        className={`beer-liquid ${isIOS ? 'ios-liquid' : ''} ${isTilting ? 'tilting' : ''}`}
        style={calculateLiquidStyle()}
      >
        {/* Random animated bubbles */}
        {bubbles.map(bubble => (
          <div
            key={`bubble-${bubble.id}`}
            className="bubble"
            style={{
              position: 'absolute',
              left: bubble.left,
              bottom: '10px',
              width: bubble.size,
              height: bubble.size,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)',
              animation: `bubble-rise 3s ease-in ${bubble.delay} infinite`,
              zIndex: 2
            }}
          />
        ))}
      </div>
      
      {/* Beer foam */}
      <div
        ref={foamRef}
        className="beer-foam"
        style={{
          ...calculateFoamStyle(),
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${liquidHeight}%`,
          height: '18px',
          background: 'linear-gradient(to bottom, rgba(255, 252, 232, 0.95) 0%, rgba(255, 248, 210, 0.5) 60%, transparent 100%)',
          borderRadius: '2px',
          zIndex: 3,
          boxShadow: 'inset 0 2px 3px -1px rgba(255, 255, 255, 0.7)',
          opacity: liquidHeight > 0 ? 0.95 : 0, // Hide foam when empty
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default BeerGlass; 