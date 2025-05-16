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
  const liquidSvgRef = useRef<SVGSVGElement>(null);
  
  // Slow down how fast the beer depletes visually - smooth out changes
  const visualBeerLevel = useMemo(() => {
    return Math.max(0, Math.min(100, beerLevel));
  }, [beerLevel]);
  
  // Track last known good beer level for side residue calculation
  const [lastSignificantLevel, setLastSignificantLevel] = useState(visualBeerLevel);

  // Keep track of previous tilt value for smoother transitions
  const [prevTiltX, setPrevTiltX] = useState(0);
  
  // Keep track of dimensions for SVG path calculations
  const [glassDimensions, setGlassDimensions] = useState({ width: 0, height: 0 });
  
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
  
  // Track glass residue (beer that clings to sides)
  const [residueDrops, setResidueDrops] = useState<Array<{
    id: number,
    left: string,
    top: string,
    width: string,
    height: string,
    opacity: number
  }>>([]);
  
  // Measure glass dimensions for accurate SVG path calculations
  useEffect(() => {
    if (glassRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setGlassDimensions({ width, height });
        }
      });
      
      resizeObserver.observe(glassRef.current);
      
      // Initial measurement
      setGlassDimensions({
        width: glassRef.current.offsetWidth,
        height: glassRef.current.offsetHeight
      });
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);
  
  // Force update on liquid level change for better transitions
  useEffect(() => {
    if (liquidRef.current) {
      liquidRef.current.style.height = `${visualBeerLevel}%`;
    }
    
    // Update the last significant level for residue calculation
    // Only update when the level decreases significantly to create "sticky" effect
    if (visualBeerLevel < lastSignificantLevel - 2) {
      setLastSignificantLevel(prevLevel => {
        // Create new residue drops when level decreases significantly
        if (prevLevel > 20 && visualBeerLevel < prevLevel - 5) {
          createResidueDrops(prevLevel);
        }
        return visualBeerLevel;
      });
    }
  }, [visualBeerLevel, lastSignificantLevel]);
  
  // Create beer residue that sticks to glass sides when beer level drops
  const createResidueDrops = (previousLevel: number) => {
    if (previousLevel < 10) return; // Don't create drops when nearly empty
    
    // Number of drops based on how much the level decreased
    const dropCount = 3 + Math.floor(Math.random() * 5);
    
    // Create residue drops at the previous liquid level
    const newDrops = Array(dropCount).fill(0).map((_, i) => ({
      id: Date.now() + i,
      left: `${Math.random() * 85 + 5}%`,
      top: `${100 - previousLevel - 5 + Math.random() * 8}%`,
      width: `${2 + Math.random() * 6}px`,
      height: `${10 + Math.random() * 25}px`,
      opacity: 0.2 + Math.random() * 0.4
    }));
    
    // Add new drops to existing ones
    setResidueDrops(prev => [...prev, ...newDrops]);
    
    // Slowly fade out residue drops over time
    setTimeout(() => {
      setResidueDrops(prev => 
        prev.map(drop => ({
          ...drop,
          opacity: drop.opacity * 0.7
        })).filter(drop => drop.opacity > 0.05)
      );
    }, 5000);
  };
  
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
    const newDrops = Array(25).fill(0).map((_, i) => ({
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
      if (visualBeerLevel > 5) { // Only create bubbles when there's beer
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
  }, []);
  
  // Apply much stronger low-pass filter to tilt direction for slower, smoother motion
  // ONLY use x-axis for more realistic drinking simulation
  const smoothedTiltDirection = useMemo(() => {
    // Only consider X-axis tilt (left-right movement) for more natural drinking motion
    // Stronger smoothing factor for much slower movement
    const filterStrength = isIOS ? 0.92 : 0.90; 
    
    // Calculate new tilt value with strong smoothing for slower motion
    const newTiltX = prevTiltX * filterStrength + (tiltDirection.x * (1 - filterStrength));
    
    // Update previous tilt for next frame
    setPrevTiltX(newTiltX);
    
    return {
      x: newTiltX,
      y: 0 // Ignore Y-axis tilt completely
    };
  }, [tiltDirection.x, prevTiltX, isIOS]);
  
  // Adjust tilt values for iOS specifically
  const adjustedTiltDirection = {
    x: isIOS ? smoothedTiltDirection.x * 1.1 : smoothedTiltDirection.x, // Slight amplification on iOS
    y: 0 // Not using Y-axis at all
  };
  
  // Calculate SVG path for liquid shape - for realistic curved liquid surface
  const calculateLiquidPath = (): string => {
    if (glassDimensions.width === 0 || glassDimensions.height === 0) {
      return '';
    }
    
    const { width, height } = glassDimensions;
    const levelHeight = (height * visualBeerLevel) / 100;
    
    // The tilt will affect the angle of the liquid surface
    const isTiltingTowardMouth = Math.abs(adjustedTiltDirection.x) > 0.2;
    const tiltAmount = adjustedTiltDirection.x;
    
    // Calculate the liquid surface angle based on tilt
    // When device is level, liquid surface is flat (horizontal)
    // When device is tilted, liquid surface stays level with gravity (at an angle to the device)
    const surfaceAngleRadians = -tiltAmount * Math.PI / 4; // Convert to radians, scale appropriately
    
    // Calculate the vertical offset of liquid at left and right edges due to tilt
    const leftEdgeY = levelHeight + Math.sin(surfaceAngleRadians) * (width / 2);
    const rightEdgeY = levelHeight - Math.sin(surfaceAngleRadians) * (width / 2);
    
    // For meniscus effect - liquid curves up slightly at the edges where it meets the glass
    // This is more pronounced when less tilted, as real liquids do
    const meniscusAmount = isTiltingTowardMouth ? 3 : 6;
    const leftMeniscusY = Math.max(0, leftEdgeY - meniscusAmount);
    const rightMeniscusY = Math.max(0, rightEdgeY - meniscusAmount);
    
    // Calculate control points for the curved surface using quadratic bezier
    // This creates a more natural curved surface vs a straight line
    const controlPointX = width / 2; // Middle of the glass horizontally
    const controlPointY = (leftEdgeY + rightEdgeY) / 2 + 
                          (isTiltingTowardMouth ? -5 * Math.abs(tiltAmount) : 5); // Bulge the surface naturally
    
    // Build the SVG path
    // Start at bottom left corner
    let path = `M 0,${height} `;
    
    // Line to bottom right corner
    path += `L ${width},${height} `;
    
    // Line up right side to the liquid level at right edge
    path += `L ${width},${rightMeniscusY} `;
    
    // Curved surface from right to left using quadratic bezier
    path += `Q ${controlPointX},${controlPointY} 0,${leftMeniscusY} `;
    
    // Close the path
    path += 'Z';
    
    return path;
  };
  
  // Enhanced liquid physics calculation with focus on realistic drinking angle
  const calculateLiquidStyle = (): LiquidStyle => {
    // We're only considering X-axis tilt (left-right) for natural drinking motion
    // This represents tilting the glass toward your mouth
    const sideAngle = adjustedTiltDirection.x * 25; // Base rotation for left-right tilt
    
    // Calculate if glass is tilted toward mouth - only valid if tilting significantly
    const isTiltingTowardMouth = isTilting && Math.abs(adjustedTiltDirection.x) > 0.2;
    
    // Simulate drinking angle - for realistic drinking, the glass tilts toward mouth
    const drinkingAngle = isTiltingTowardMouth ? Math.abs(adjustedTiltDirection.x) * 70 : 0;
    
    // Calculate tilt offset for liquid shift - more pronounced when drinking
    const tiltOffset = Math.min(30, Math.abs(adjustedTiltDirection.x) * 60);
    const shiftX = isTiltingTowardMouth 
      ? `${adjustedTiltDirection.x * tiltOffset * 1.2}%` 
      : "0%";
    
    // Factor in velocity for subtle inertia effects
    const inertiaX = velocity.x * 3; // Reduced for slower motion
    
    // Create transform array with enhanced physics
    const transforms = [];
    
    // Base rotation from left-right tilt
    transforms.push(`rotateZ(${sideAngle + inertiaX * 0.2}deg)`);
    
    // Add tilt-based transforms for more realistic fluid movement
    if (isTiltingTowardMouth) {
      // Translate liquid toward mouth direction
      transforms.push(`translateX(${shiftX})`);
      
      // Add skew for realism - liquid surface tilts
      transforms.push(`skewX(${-adjustedTiltDirection.x * 15}deg)`);
    }
    
    // Determine transform origin based on tilt direction for drinking motion
    // Origin is opposite the tilt direction (pivot point)
    const transformOrigin = isTiltingTowardMouth 
      ? `bottom ${adjustedTiltDirection.x < 0 ? 'right' : 'left'}`
      : 'bottom center';
    
    // Calculate easing curve - slower for more natural movement
    const transitionTiming = isTilting 
      ? `cubic-bezier(0.22, 1, 0.36, 1)` 
      : `cubic-bezier(0.34, 1.56, 0.64, 1)`;
    
    // Calculate wave effect strength - more subtle now
    const waveStrength = Math.min(0.7, Math.abs(velocity.x) * 3) * (drinkingAngle > 20 ? 0.7 : 0.3);
    
    // Ensure there's more beer at the side of the glass when tilting toward mouth
    const sideRiseEffect = isTiltingTowardMouth ? `radial-gradient(
      ellipse at ${adjustedTiltDirection.x < 0 ? 'right' : 'left'} bottom,
      transparent 0%,
      transparent 50%,
      rgba(209, 142, 12, 0.2) 50%,
      rgba(209, 142, 12, 0.3) 100%
    )` : 'none';
    
    // Calculate the border radius of the liquid based on tilt
    // More pronounced curve at rest, flatter when tilting heavily
    const topCurve = isTiltingTowardMouth ? 
      `${10 - Math.abs(adjustedTiltDirection.x) * 5}% ${10 - Math.abs(adjustedTiltDirection.x) * 5}% 0 0` :
      '15% 15% 0 0';
    
    // Create a meniscus effect - the curved beer surface where it touches the glass
    const meniscusOpacity = isTiltingTowardMouth ? 0.5 - Math.abs(adjustedTiltDirection.x) * 0.3 : 0.5;
    
    return {
      height: `${visualBeerLevel}%`,
      transformOrigin: transformOrigin,
      transform: transforms.length ? transforms.join(' ') : 'none',
      transition: `all 0.8s ${transitionTiming}`, // Even slower transition for smoother movement
      // Add a visual effect to the liquid's top edge when tilted
      borderTop: visualBeerLevel > 0 && isTilting ? '2px solid rgba(255,220,150,0.7)' : 'none',
      // Enhanced shadow for more realistic depth
      boxShadow: `
        inset 0px 5px 15px rgba(0,0,0,${0.15 + Math.abs(adjustedTiltDirection.x) * 0.2}),
        inset 0px -10px 10px -10px rgba(255,255,255,0.1)
      `,
      // Wave animation strength tied to motion
      animationName: waveStrength > 0.1 ? 'beer-wave' : 'none',
      animationDuration: '3s', // Slower wave animation
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
      animationPlayState: isTilting ? 'running' : 'paused',
      // Use hardware acceleration for better performance on iOS
      WebkitTransform: transforms.length ? transforms.join(' ') : 'none',
      WebkitBackfaceVisibility: 'hidden',
      // Add background with side-clinging effects
      backgroundImage: sideRiseEffect,
      backgroundSize: '100% 100%',
      backgroundBlendMode: 'overlay',
      // Natural curved liquid top surface
      borderRadius: topCurve,
      // Make the beer more rounded on the sides for a more natural look
      borderLeft: '4px solid transparent',
      borderRight: '4px solid transparent',
      // Give the beer a slight gradient for more depth
      background: `
        linear-gradient(
          to bottom, 
          rgba(240, 180, 50, 0.8) 0%, 
          rgba(209, 142, 12, 0.7) 30%,
          rgba(180, 120, 5, 0.8) 100%
        )
      `,
      // Adjust the opacity for better realism
      opacity: 0.9,
    };
  };
  
  // Improved physics for the foam to move more independently
  const calculateFoamStyle = (): CSSProperties => {
    const sideAngle = adjustedTiltDirection.x * 12; // Less dramatic than liquid
    const transforms = [];
    
    // Factor in liquid level - foam sticks to glass more as level decreases
    const liquidRatio = visualBeerLevel / 100;
    
    // Foam rotates less than liquid
    transforms.push(`rotateZ(${sideAngle * 0.6}deg)`);
    
    // Foam lags behind liquid with damping based on remaining beer
    if (isTilting && Math.abs(adjustedTiltDirection.x) > 0.2) {
      // Foam follows liquid but with more lag
      transforms.push(`translateX(${adjustedTiltDirection.x * (2 + (1-liquidRatio) * 2)}%)`);
      
      // Foam compresses slightly when glass is tilted heavily
      if (Math.abs(adjustedTiltDirection.x) > 0.5) {
        transforms.push(`scaleY(${1 - Math.abs(adjustedTiltDirection.x) * 0.15})`);
      }
    }
    
    return {
      transform: transforms.length ? transforms.join(' ') : 'none',
      // Even slower transition than liquid for natural feel
      transition: 'all 0.95s cubic-bezier(0.34, 1.56, 0.64, 1)', 
      WebkitTransform: transforms.length ? transforms.join(' ') : 'none',
      // Make foam thinner as liquid decreases
      height: `${Math.max(10, 18 * (liquidRatio * 0.8 + 0.2))}px`, // Taller foam
      // Reduce opacity slightly when nearly empty
      opacity: visualBeerLevel > 10 ? 0.95 : Math.max(0.5, visualBeerLevel / 10),
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
    // Glass tilts in the direction the user is "drinking" from
    const glassRotation = adjustedTiltDirection.x * 5; // Small rotation angle for glass itself
    
    // Determine if we're tilting toward drinking position
    const isTiltingTowardMouth = Math.abs(adjustedTiltDirection.x) > 0.2;
    
    // Tilt glass toward "mouth" (top corner of phone)
    // This creates the impression of bringing the glass to your mouth
    const drinkingTilt = isTiltingTowardMouth 
      ? `rotateZ(${glassRotation}deg) rotate${adjustedTiltDirection.x < 0 ? 'Y' : 'Y'}(${Math.abs(adjustedTiltDirection.x) * 5}deg)`
      : `rotateZ(${glassRotation}deg)`;
    
    return {
      transform: drinkingTilt,
      transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)', // Slower glass movement
      // Position the drinking edge at top corner based on tilt direction
      transformOrigin: adjustedTiltDirection.x < 0 ? 'top right' : 'top left',
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
        overflow: 'hidden',
        width: '80vw', // Bigger glass
        maxWidth: '400px',
        height: '400px', // Taller glass
        margin: '0 auto',
        borderRadius: '10% 10% 0 0 / 5% 5% 0 0', // Pint glass shape - slightly curved at top
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
        boxShadow: '0 0 20px rgba(255,255,255,0.1), inset 0 0 15px rgba(255,255,255,0.05)',
        // Boston/Pint shape with subtle curves
        clipPath: 'polygon(0% 5%, 4% 0, 96% 0, 100% 5%, 102% 100%, -2% 100%)'
      }}
    >
      {/* Drinking edge indicators - subtle highlights at top corners */}
      <div
        className="glass-mouth-left"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20%',
          height: '5px',
          background: 'linear-gradient(to right, rgba(255,255,255,0.5), transparent)',
          borderRadius: '30% 0 0 0',
          zIndex: 10,
          opacity: adjustedTiltDirection.x > 0.1 ? 0.8 : 0.2, // Highlight when tilting this way
          transition: 'opacity 0.5s ease'
        }}
      />
      
      <div
        className="glass-mouth-right"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '20%',
          height: '5px',
          background: 'linear-gradient(to left, rgba(255,255,255,0.5), transparent)',
          borderRadius: '0 30% 0 0',
          zIndex: 10,
          opacity: adjustedTiltDirection.x < -0.1 ? 0.8 : 0.2, // Highlight when tilting this way
          transition: 'opacity 0.5s ease'
        }}
      />
      
      {/* Beer residue that clings to the sides of the glass */}
      {residueDrops.map(drop => (
        <div
          key={`residue-${drop.id}`}
          className="beer-residue"
          style={{
            position: 'absolute',
            left: drop.left,
            top: drop.top,
            width: drop.width,
            height: drop.height,
            background: 'linear-gradient(to bottom, rgba(209, 142, 12, 0.4), rgba(209, 142, 12, 0.1))',
            borderRadius: '40%',
            opacity: drop.opacity,
            zIndex: 2,
            transition: 'opacity 8s linear'
          }}
        />
      ))}
    
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
      
      {/* SVG liquid for realistic curved appearance */}
      <svg 
        ref={liquidSvgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${glassDimensions.width} ${glassDimensions.height}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="beerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(240, 180, 50, 0.8)" />
            <stop offset="30%" stopColor="rgba(209, 142, 12, 0.7)" />
            <stop offset="100%" stopColor="rgba(180, 120, 5, 0.8)" />
          </linearGradient>
          <filter id="liquidFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        <path 
          d={calculateLiquidPath()} 
          fill="url(#beerGradient)"
          filter="url(#liquidFilter)"
          style={{
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      
      {/* Beer substrate - gives the beer its rich color with gradient */}
      <div
        className="beer-substrate"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '2%',
          right: '2%',
          height: `${visualBeerLevel}%`,
          background: 'linear-gradient(to bottom, rgba(209, 142, 12, 0.2) 0%, rgba(209, 142, 12, 0.4) 100%)',
          zIndex: 1,
          transition: 'height 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          borderRadius: '5px 5px 0 0',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
        }}
      />
      
      {/* Beer meniscus effect - the curved edge where beer meets glass */}
      <div
        className="beer-meniscus"
        style={{
          position: 'absolute',
          bottom: `${visualBeerLevel}%`,
          left: 0,
          right: 0,
          height: '8px',
          background: 'linear-gradient(to bottom, rgba(255,220,130,0.3), transparent)',
          zIndex: 2,
          borderRadius: '100% 100% 0 0 / 200% 200% 0 0',
          opacity: visualBeerLevel > 5 ? 0.7 : 0,
          transition: 'bottom 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease',
          transform: `scaleY(${isTilting ? 0.5 : 1})`,
          pointerEvents: 'none'
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
      
      {/* Beer Liquid - with curved natural appearance */}
      <div
        ref={liquidRef}
        className={`beer-liquid ${isIOS ? 'ios-liquid' : ''} ${isTilting ? 'tilting' : ''}`}
        style={calculateLiquidStyle()}
      >
        {/* Beer surface highlight for realism */}
        <div 
          className="beer-surface-highlight"
          style={{
            position: 'absolute',
            top: '0',
            left: '5%',
            right: '5%',
            height: '10px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
            borderRadius: '100% 100% 0 0 / 200% 200% 0 0',
            opacity: 0.6,
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
        
        {/* Only show bubbles when there's enough beer */}
        {visualBeerLevel > 5 && bubbles.map(bubble => (
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
              animation: `bubble-rise-${bubble.path} ${4 / bubble.speed}s ease-in ${bubble.delay} infinite`, // Slower bubbles
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
          left: '1%',
          right: '1%',
          bottom: `${visualBeerLevel}%`,
          background: 'linear-gradient(to bottom, rgba(255, 252, 232, 0.95) 0%, rgba(255, 248, 210, 0.5) 60%, transparent 100%)',
          borderRadius: '30% 30% 5px 5px / 20% 20% 5px 5px',
          zIndex: 3,
          boxShadow: 'inset 0 2px 3px -1px rgba(255, 255, 255, 0.7)',
          pointerEvents: 'none',
          transition: 'bottom 0.8s cubic-bezier(0.22, 1, 0.36, 1)' // Match liquid level transition
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
          height: '8px', // Thicker rim
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
          borderRadius: '30px 30px 0 0',
          zIndex: 5,
          pointerEvents: 'none'
        }}
      />
      
      {/* Glass bottom for pint shape */}
      <div 
        className="glass-bottom"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '15px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.15), transparent)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default BeerGlass; 