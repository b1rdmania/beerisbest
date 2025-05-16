import React, { useEffect, useCallback, useState, useRef } from 'react';
import { isIOS } from 'react-device-detect';

interface TiltDetectorProps {
  onTiltChange: (tiltData: { 
    alpha: number | null; 
    beta: number | null; 
    gamma: number | null;
    isTiltedForward: boolean;
    tiltDirection: { x: number, y: number };
    velocity: { x: number, y: number };
  }) => void;
}

const TiltDetector: React.FC<TiltDetectorProps> = ({ onTiltChange }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionAttempted, setPermissionAttempted] = useState(false);
  const [usingMouseFallback, setUsingMouseFallback] = useState(false);
  const [orientationSupported, setOrientationSupported] = useState(true);
  
  // Store previous values for velocity calculation
  const prevTiltRef = useRef<{ beta: number | null, gamma: number | null, timestamp: number }>({
    beta: null,
    gamma: null,
    timestamp: Date.now()
  });
  
  // Low-pass filter to reduce noise (weighted average)
  const filterSensorData = (newValue: number, prevValue: number | null, alpha = 0.8): number => {
    if (prevValue === null) return newValue;
    return alpha * newValue + (1 - alpha) * prevValue;
  };
  
  // Calculate velocity based on change over time
  const calculateVelocity = (current: number | null, previous: number | null, timeDelta: number): number => {
    if (current === null || previous === null) return 0;
    // Calculate change per second, limit to reasonable range
    return Math.max(-1, Math.min(1, (current - previous) / (timeDelta / 1000) / 180));
  };

  // Create a more robust orientation handler with velocity calculation
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // Ensure we have valid data
    if (event.beta === null || event.gamma === null) return;
    
    const now = Date.now();
    const timeDelta = now - prevTiltRef.current.timestamp;
    
    let beta = event.beta; // Front-to-back tilt
    let gamma = event.gamma; // Left-to-right tilt
    
    // Apply low-pass filter for smoother data
    beta = filterSensorData(beta, prevTiltRef.current.beta);
    gamma = filterSensorData(gamma, prevTiltRef.current.gamma);
    
    // iOS-specific adjustments
    if (isIOS) {
      // iOS has different orientation behavior in landscape mode
      if (window.orientation === 90) {
        // Landscape right
        const temp = beta;
        beta = gamma;
        gamma = -temp;
      } else if (window.orientation === -90) {
        // Landscape left
        const temp = beta;
        beta = -gamma;
        gamma = temp;
      } else if (window.orientation === 180) {
        // Upside down
        beta = -beta;
        gamma = -gamma;
      }
    }
    
    // Calculate velocity (change per second)
    const velocityX = calculateVelocity(gamma, prevTiltRef.current.gamma, timeDelta);
    const velocityY = calculateVelocity(beta, prevTiltRef.current.beta, timeDelta);
    
    // Store current values for next velocity calculation
    prevTiltRef.current = {
      beta,
      gamma,
      timestamp: now
    };
    
    // Calculate if device is tilted forward enough to pour
    // For iOS, we need to be more precise with this calculation
    const isTiltedForward = beta > 45 && Math.abs(gamma) < 60;
    
    // Calculate tilt direction for realistic liquid physics
    // Normalize the values to a range between -1 and 1
    const tiltDirection = {
      x: Math.max(-1, Math.min(1, gamma / 90)), // Left-right tilt
      y: Math.max(-1, Math.min(1, (beta - 90) / 90)), // Front-back tilt beyond level
    };
    
    onTiltChange({
      alpha: event.alpha,
      beta, 
      gamma,
      isTiltedForward,
      tiltDirection,
      velocity: { x: velocityX, y: velocityY }
    });
  }, [onTiltChange]);

  // Desktop fallback - use mouse position to simulate tilt with velocity
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!usingMouseFallback) return;
    
    const now = Date.now();
    const timeDelta = now - prevTiltRef.current.timestamp;
    
    // Convert mouse position to tilt angles
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate normalized position (-1 to 1)
    const normalizedX = (e.clientX - centerX) / (window.innerWidth / 2);
    const normalizedY = (e.clientY - centerY) / (window.innerHeight / 2);
    
    // Convert to device orientation angles
    const beta = normalizedY * 90; // -90 to 90 degrees
    const gamma = normalizedX * 90; // -90 to 90 degrees
    
    // Apply smoothing filter
    const filteredBeta = filterSensorData(beta, prevTiltRef.current.beta, 0.7);
    const filteredGamma = filterSensorData(gamma, prevTiltRef.current.gamma, 0.7);
    
    // Calculate velocity
    const velocityX = calculateVelocity(filteredGamma, prevTiltRef.current.gamma, timeDelta);
    const velocityY = calculateVelocity(filteredBeta, prevTiltRef.current.beta, timeDelta);
    
    // Update previous values for next calculation
    prevTiltRef.current = {
      beta: filteredBeta,
      gamma: filteredGamma,
      timestamp: now
    };
    
    // Calculate if "device" is tilted forward enough to pour
    const isTiltedForward = filteredBeta > 45 && Math.abs(filteredGamma) < 60;
    
    // Calculate tilt direction for liquid physics
    const tiltDirection = {
      x: Math.max(-1, Math.min(1, filteredGamma / 90)),
      y: Math.max(-1, Math.min(1, (filteredBeta - 90) / 90)),
    };
    
    onTiltChange({
      alpha: 0,
      beta: filteredBeta,
      gamma: filteredGamma,
      isTiltedForward,
      tiltDirection,
      velocity: { x: velocityX, y: velocityY }
    });
  }, [onTiltChange, usingMouseFallback]);

  // Handle iOS permission more robustly
  const requestIOSPermission = useCallback(async () => {
    setPermissionAttempted(true);
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          // Don't add event listener here - let the useEffect handle that
        } else {
          console.warn('Device orientation permission denied');
          alert('This app needs motion sensors to work. Please allow motion sensor access.');
        }
      } else {
        // Non-iOS or older iOS that doesn't require permission
        setPermissionGranted(true);
        // Don't add event listener here - let the useEffect handle that
      }
    } catch (error) {
      console.error('Error requesting device orientation permission:', error);
      alert('Could not access motion sensors. This app requires motion sensors to work properly.');
      // Fall back to mouse control on error
      setOrientationSupported(false);
      setUsingMouseFallback(true);
    }
  }, []);

  // Handle orientation changes (landscape/portrait)
  useEffect(() => {
    const handleOrientationChange = () => {
      // Force a re-render on orientation change
      console.log('Screen orientation changed:', window.orientation);
      
      // Reset velocity tracking on orientation change
      prevTiltRef.current = {
        beta: null,
        gamma: null,
        timestamp: Date.now()
      };
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Check for device orientation support on mount
  useEffect(() => {
    // First try to determine if we need to fall back to mouse control
    const checkOrientationSupport = () => {
      // If we're on a desktop or device orientation is not supported
      if (window.DeviceOrientationEvent === undefined) {
        setOrientationSupported(false);
        setUsingMouseFallback(true);
        return;
      }
      
      // Skip the event check on non-secure contexts (like http:// or file://)
      // This avoids permission issues that could cause errors
      if (window.isSecureContext === false) {
        setOrientationSupported(false);
        setUsingMouseFallback(true);
        return;
      }
      
      // Immediately set to use mouse fallback for desktop environments
      // This avoids the complexity of waiting for device orientation events
      if (!isIOS && !window.matchMedia('(pointer: coarse)').matches) {
        setOrientationSupported(false);
        setUsingMouseFallback(true);
        return;
      }
      
      // For mobile devices, just set orientation as supported
      // We'll rely on other mechanisms to detect if it's actually working
      if (isIOS || window.matchMedia('(pointer: coarse)').matches) {
        setOrientationSupported(true);
      }
    };
    
    checkOrientationSupport();
  }, []);

  // Setup orientation listening
  useEffect(() => {
    // If using mouse fallback, set up mouse listeners
    if (usingMouseFallback) {
      window.addEventListener('mousemove', handleMouseMove);
      
      // Add a helpful message for desktop users
      const desktopControlElem = document.createElement('div');
      desktopControlElem.className = 'desktop-control';
      desktopControlElem.textContent = 'Move your mouse to tilt the glass';
      document.body.appendChild(desktopControlElem);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (desktopControlElem.parentNode) {
          document.body.removeChild(desktopControlElem);
        }
      };
    }
  
    // Automatic setup for non-iOS devices that support orientation
    if (!isIOS && orientationSupported) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    } 
    // iOS devices will need explicit permission request via user interaction
    else if (isIOS && permissionGranted) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    }
    
    return undefined;
  }, [handleOrientation, permissionGranted, usingMouseFallback, handleMouseMove, orientationSupported]);

  // Return a button for iOS to request permissions
  if (isIOS && !permissionGranted) {
    return (
      <div className="ios-permission-prompt">
        <button 
          onClick={requestIOSPermission}
          className="ios-permission-button"
        >
          Enable Tilt Detection
        </button>
        <p>Tap to enable motion sensors for the beer experience</p>
      </div>
    );
  }

  // For non-iOS or when permission is granted
  return null;
};

export default TiltDetector; 