import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { isIOS } from 'react-device-detect';

interface BeerGlassProps {
  beerLevel: number; // Percentage 0-100
  isTilting: boolean; // True if device is tilted significantly
  tiltDirection?: { x: number, y: number }; // Direction of tilt (-1 to 1 for both x and y)
  velocity?: { x: number, y: number }; // Velocity of tilt change
}

interface LiquidStyle extends CSSProperties {
  WebkitTransform?: string;
  WebkitBackfaceVisibility?: 'hidden' | 'visible';
}

const BeerGlass: React.FC<BeerGlassProps> = ({ 
  beerLevel, 
  isTilting, 
  tiltDirection = { x: 0, y: 0 },
  velocity = { x: 0, y: 0 }
}) => {
  const liquidRef = useRef<HTMLDivElement>(null);
  const foamRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const liquidHeight = Math.max(0, Math.min(100, beerLevel)); // Clamp between 0 and 100
  
  // State for visual elements
  const [bubbles, setBubbles] = useState<Array<{
    id: number, 
    left: string, 
    delay: string, 
    size: string, 
    speed: number, 
    path: 'straight' | 'curved-left' | 'curved-right'
  }>>([]);
  
  const [condensation, setCondensation] = useState<Array<{
    id: number, 
    left: string, 
    top: string, 
    size: string, 
    delay: string, 
    speed: number,
    opacity: number
  }>>([]);
  
  const [foamBubbles, setFoamBubbles] = useState<Array<{
    id: number, 
    left: string, 
    size: string, 
    opacity: number
  }>>([]);
  
  // Force update on liquid level change for better transitions
  useEffect(() => {
    if (liquidRef.current) {
      liquidRef.current.style.height = `${liquidHeight}%`;
    }
  }, [liquidHeight]);
  
  // Generate random bubbles on component mount with more variety
  useEffect(() => {
    // Create more varied bubbles
    const newBubbles = Array(12).fill(0).map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 4}s`,
      size: `${3 + Math.random() * 7}px`,
      speed: 0.7 + Math.random() * 2,
      path: ['straight', 'curved-left', 'curved-right'][Math.floor(Math.random() * 3)] as 'straight' | 'curved-left' | 'curved-right'
    }));
    setBubbles(newBubbles);
    
    // Create condensation droplets with varied opacity
    const newDrops = Array(20).fill(0).map((_, i) => ({
      id: i,
      left: `${Math.random() * 90}%`,
      top: `${5 + Math.random() * 80}%`,
      size: `${1 + Math.random() * 6}px`,
      delay: `${Math.random() * 8}s`,
      speed: 0.3 + Math.random() * 0.7,
      opacity: 0.3 + Math.random() * 0.5
    }));
    setCondensation(newDrops);
    
    // Create foam bubbles for more realistic foam
    const newFoamBubbles = Array(15).fill(0).map((_, i) => ({
      id: i,
      left: `${Math.random() * 95}%`,
      size: `${2 + Math.random() * 5}px`,
      opacity: 0.4 + Math.random() * 0.5
    }));
    setFoamBubbles(newFoamBubbles);
    
    // Set up periodic bubble refreshing
    const bubbleRefreshInterval = setInterval(() => {
      if (beerLevel > 0) {
        setBubbles(prev => {
          // Replace 1-3 bubbles with new ones
          const numToReplace = 1 + Math.floor(Math.random() * 3);
          const newArray = [...prev];
          
          for (let i = 0; i < numToReplace; i++) {
            const indexToReplace = Math.floor(Math.random() * prev.length);
            newArray[indexToReplace] = {
              ...newArray[indexToReplace],
              left: `${5 + Math.random() * 90}%`,
              delay: `${Math.random() * 0.2}s`, // Short delay for immediate effect
              size: `${3 + Math.random() * 7}px`,
              speed: 0.7 + Math.random() * 2,
              path: ['straight', 'curved-left', 'curved-right'][Math.floor(Math.random() * 3)] as 'straight' | 'curved-left' | 'curved-right'
            };
          }
          
          return newArray;
        });
      }
    }, 2000);
    
    return () => clearInterval(bubbleRefreshInterval);
  }, [beerLevel]);
  
  // Apply low-pass filter to tilt direction for smoother motion
  const smoothedTiltDirection = useMemo(() => {
    // Simple low-pass filter with bias toward recent values for iOS
    const filterStrength = isIOS ? 0.8 : 0.7;
    
    return {
      x: tiltDirection.x * filterStrength + (1 - filterStrength) * (tiltDirection.x || 0),
      y: tiltDirection.y * filterStrength + (1 - filterStrength) * (tiltDirection.y || 0)
    };
  }, [tiltDirection.x, tiltDirection.y, isIOS]);
  
  // Adjust tilt values for iOS specifically
  const adjustedTiltDirection = {
    x: isIOS ? smoothedTiltDirection.x * 1.2 : smoothedTiltDirection.x, // Amplify a bit on iOS
    y: isIOS ? smoothedTiltDirection.y * 1.2 : smoothedTiltDirection.y,
  };
  
  // Enhanced liquid physics calculation
  const calculateLiquidStyle = (): LiquidStyle => {
    // Calculate tilt angle from direction vectors
    const tiltAngle = isTilting ? Math.max(0, adjustedTiltDirection.y * 90) : 0;
    const sideAngle = adjustedTiltDirection.x * 25; // Left-right tilt angle
    
    // Calculate liquid shift based on tilt with improved physics
    const tiltOffset = Math.min(35, (tiltAngle / 90) * 60);
    const shiftX = tiltAngle > 25 ? `${adjustedTiltDirection.x * tiltOffset * 1.2}%` : "0%";
    
    // Factor in velocity for inertia effects (subtle)
    const inertiaX = velocity.x * 5;
    const inertiaY = velocity.y * 3;
    
    // Create transform array with enhanced physics
    const transforms = [];
    
    // Base rotation from left-right tilt
    transforms.push(`rotateZ(${sideAngle + inertiaX * 0.3}deg)`);
    
    // Add tilt-based transforms for more realistic fluid
    if (tiltAngle > 0) {
      // More dramatic transform when significantly tilted
      if (tiltAngle > 25) {
        transforms.push(`translateX(${shiftX})`);
        
        // Add subtle Y translation for depth
        if (tiltAngle > 45) {
          transforms.push(`translateY(${-tiltAngle * 0.05}px)`);
        }
      }
      
      // Add skew for realism with inertia
      transforms.push(`skewX(${(-adjustedTiltDirection.y * 6) + inertiaY}deg)`);
    }
    
    // Determine transform origin based on tilt direction and angle
    const transformOrigin = tiltAngle > 25 
      ? `bottom ${adjustedTiltDirection.x < 0 ? 'right' : 'left'}`
      : 'bottom center';
    
    // Calculate easing curve based on motion
    const transitionTiming = isTilting ? 
      `cubic-bezier(0.22, 1, 0.36, 1)` : 
      `cubic-bezier(0.34, 1.56, 0.64, 1)`;
    
    // Calculate wave effect strength based on velocity and tilt
    const waveStrength = Math.min(1, Math.abs(velocity.x) * 5) * (tiltAngle > 30 ? 1 : 0.5);
    
    return {
      height: `${liquidHeight}%`,
      transformOrigin: transformOrigin,
      transform: transforms.length ? transforms.join(' ') : 'none',
      transition: `all 0.3s ${transitionTiming}`,
      // Add a visual effect to the liquid's top edge when tilted
      borderTop: liquidHeight > 0 && isTilting ? '2px solid rgba(255,220,150,0.7)' : 'none',
      // Enhanced shadow for more realistic depth
      boxShadow: isTilting && liquidHeight > 0 
        ? `inset 0px 5px 15px rgba(0,0,0,${0.15 + tiltAngle/90 * 0.15})` 
        : 'none',
      // Wave animation strength tied to motion
      animationName: waveStrength > 0.1 ? 'beer-wave' : 'none',
      animationDuration: '2s',
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
      animationPlayState: isTilting ? 'running' : 'paused',
      // Use hardware acceleration for better performance on iOS
      WebkitTransform: transforms.length ? transforms.join(' ') : 'none',
      WebkitBackfaceVisibility: 'hidden',
    };
  };
  
  // Improved physics for the foam to move more independently
  const calculateFoamStyle = (): CSSProperties => {
    const sideAngle = adjustedTiltDirection.x * 15; // Less dramatic than liquid
    const transforms = [];
    
    // Factor in liquid level - foam sticks to glass more as level decreases
    const liquidRatio = liquidHeight / 100;
    
    // Foam rotates less than liquid
    transforms.push(`rotateZ(${sideAngle * 0.6}deg)`);
    
    // Foam lags behind liquid with damping based on remaining beer
    if (isTilting && adjustedTiltDirection.y > 0) {
      // Foam follows liquid but with more lag when less liquid remains
      transforms.push(`translateX(${adjustedTiltDirection.x * (3 + (1-liquidRatio) * 3)}%)`);
      
      // Foam compresses slightly when glass is tilted heavily
      if (adjustedTiltDirection.y > 0.6) {
        transforms.push(`scaleY(${1 - adjustedTiltDirection.y * 0.15})`);
      }
    }
    
    return {
      transform: transforms.length ? transforms.join(' ') : 'none',
      // Slower transition than liquid for natural feel
      transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
      WebkitTransform: transforms.length ? transforms.join(' ') : 'none',
      // Make foam thinner as liquid decreases
      height: `${Math.max(8, 14 * (liquidRatio * 0.8 + 0.2))}px`,
      // Reduce opacity slightly when nearly empty
      opacity: liquidHeight > 10 ? 0.95 : Math.max(0.5, liquidHeight / 10),
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
  
  // Apply subtle glass tilt effect separate from liquid
  const calculateGlassEffect = (): CSSProperties => {
    // Glass tilts slightly in the direction of tilt but not as much as liquid
    const glassXTilt = adjustedTiltDirection.x * 3;
    const glassYTilt = adjustedTiltDirection.y * 2;
    
    return {
      transform: `rotateZ(${glassXTilt}deg) rotateX(${glassYTilt}deg)`,
      transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
    };
  };
  
  return (
    <div
      ref={glassRef}
      className={`beer-glass ${isIOS ? 'ios-glass' : ''}`}
      style={{
        ...calculateGlassEffect(),
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
            background: `rgba(255,255,255,${drop.opacity})`,
            filter: 'blur(1px)',
            zIndex: 3,
            animation: `droplet-fall ${10 + Math.random() * 5}s linear ${drop.delay} infinite`,
            animationDuration: `${10 / drop.speed}s`,
          }}
        />
      ))}
      
      {/* Beer substrate - gives the beer its rich color */}
      <div
        className="beer-substrate"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${liquidHeight}%`,
          background: 'linear-gradient(to bottom, rgba(209, 142, 12, 0.2) 0%, rgba(209, 142, 12, 0.4) 100%)',
          zIndex: 1,
        }}
      />
      
      {/* Glass shine effect with enhanced realism */}
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
      
      {/* Secondary highlight for more realism */}
      <div
        className="glass-shine-secondary"
        style={{
          position: 'absolute',
          top: '10%',
          right: '20%',
          width: '10%',
          height: '75%',
          background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
          borderRadius: '50% / 40%',
          transform: 'rotate(15deg)',
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
        {/* Random animated bubbles with varied paths */}
        {bubbles.map(bubble => (
          <div
            key={`bubble-${bubble.id}`}
            className={`bubble bubble-${bubble.path}`}
            style={{
              position: 'absolute',
              left: bubble.left,
              bottom: '10px',
              width: bubble.size,
              height: bubble.size,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              filter: 'blur(0.5px)',
              animation: `bubble-rise-${bubble.path} ${3 / bubble.speed}s ease-in ${bubble.delay} infinite`,
              zIndex: 2
            }}
          />
        ))}
      </div>
      
      {/* Beer foam with enhanced visuals */}
      <div
        ref={foamRef}
        className="beer-foam"
        style={{
          ...calculateFoamStyle(),
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${liquidHeight}%`,
          background: 'linear-gradient(to bottom, rgba(255, 252, 232, 0.95) 0%, rgba(255, 248, 210, 0.5) 60%, transparent 100%)',
          borderRadius: '2px',
          zIndex: 3,
          boxShadow: 'inset 0 2px 3px -1px rgba(255, 255, 255, 0.7)',
          pointerEvents: 'none'
        }}
      >
        {/* Foam bubbles for more realistic foam */}
        {foamBubbles.map(bubble => (
          <div
            key={`foam-bubble-${bubble.id}`}
            style={{
              position: 'absolute',
              left: bubble.left,
              bottom: '0px',
              width: bubble.size,
              height: bubble.size,
              borderRadius: '50%',
              background: `rgba(255,255,255,${bubble.opacity})`,
              zIndex: 4
            }}
          />
        ))}
      </div>
      
      {/* Glass rim highlight */}
      <div 
        className="glass-rim"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
          borderRadius: '30px 30px 0 0',
          zIndex: 5,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default BeerGlass; 