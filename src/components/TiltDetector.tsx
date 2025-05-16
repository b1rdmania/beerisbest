import React, { useEffect, useCallback, useState } from 'react';
import { isIOS } from 'react-device-detect';

interface TiltDetectorProps {
  onTiltChange: (tiltData: { 
    alpha: number | null; 
    beta: number | null; 
    gamma: number | null;
    isTiltedForward: boolean;
    tiltDirection: { x: number, y: number };
  }) => void;
}

const TiltDetector: React.FC<TiltDetectorProps> = ({ onTiltChange }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionAttempted, setPermissionAttempted] = useState(false);
  const [usingMouseFallback, setUsingMouseFallback] = useState(false);
  const [orientationSupported, setOrientationSupported] = useState(true);

  // Create a more robust orientation handler for iOS
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // Ensure we have valid data
    if (event.beta === null || event.gamma === null) return;
    
    let beta = event.beta; // Front-to-back tilt
    let gamma = event.gamma; // Left-to-right tilt
    
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
    });
  }, [onTiltChange]);

  // Desktop fallback - use mouse position to simulate tilt
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!usingMouseFallback) return;
    
    // Convert mouse position to tilt angles
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate normalized position (-1 to 1)
    const normalizedX = (e.clientX - centerX) / (window.innerWidth / 2);
    const normalizedY = (e.clientY - centerY) / (window.innerHeight / 2);
    
    // Convert to device orientation angles
    const beta = normalizedY * 90; // -90 to 90 degrees
    const gamma = normalizedX * 90; // -90 to 90 degrees
    
    // Calculate if "device" is tilted forward enough to pour
    const isTiltedForward = beta > 45 && Math.abs(gamma) < 60;
    
    // Calculate tilt direction for liquid physics
    const tiltDirection = {
      x: Math.max(-1, Math.min(1, gamma / 90)),
      y: Math.max(-1, Math.min(1, (beta - 90) / 90)),
    };
    
    onTiltChange({
      alpha: 0,
      beta,
      gamma,
      isTiltedForward,
      tiltDirection,
    });
  }, [onTiltChange, usingMouseFallback]);

  // Handle iOS permission more robustly
  const requestIOSPermission = useCallback(async () => {
    if (!permissionAttempted) {
      setPermissionAttempted(true);
      try {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            setPermissionGranted(true);
            window.addEventListener('deviceorientation', handleOrientation, true);
          } else {
            console.warn('Device orientation permission denied');
            alert('This app needs motion sensors to work. Please allow motion sensor access.');
          }
        } else {
          // Non-iOS or older iOS that doesn't require permission
          setPermissionGranted(true);
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        alert('Could not access motion sensors. This app requires motion sensors to work properly.');
      }
    }
  }, [handleOrientation, permissionAttempted]);

  // Handle orientation changes (landscape/portrait)
  useEffect(() => {
    const handleOrientationChange = () => {
      // Force a re-render on orientation change
      console.log('Screen orientation changed:', window.orientation);
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
      
      // Try to detect if orientation events are actually firing
      let eventFired = false;
      
      const testHandler = () => {
        eventFired = true;
        window.removeEventListener('deviceorientation', testHandler);
      };
      
      window.addEventListener('deviceorientation', testHandler, true);
      
      // If no event after 1 second, fall back to mouse
      setTimeout(() => {
        if (!eventFired) {
          setOrientationSupported(false);
          setUsingMouseFallback(true);
        }
      }, 1000);
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