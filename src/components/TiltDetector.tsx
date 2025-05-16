import React, { useEffect, useCallback } from 'react';

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
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const beta = event.beta; // Front-to-back tilt in degrees (-180 to 180)
    const gamma = event.gamma; // Left-to-right tilt in degrees (-90 to 90)
    
    // Calculate if device is tilted forward enough to pour (beta > 45 typically)
    const isTiltedForward = beta !== null && beta > 45;
    
    // Calculate tilt direction for realistic liquid physics
    // Normalize the values to a range between -1 and 1
    // This will be used to tilt the liquid in the glass realistically
    const tiltDirection = {
      x: gamma !== null ? Math.max(-1, Math.min(1, gamma / 90)) : 0, // Left-right tilt
      y: beta !== null ? Math.max(-1, Math.min(1, (beta - 90) / 90)) : 0, // Front-back tilt beyond level
    };
    
    onTiltChange({
      alpha: event.alpha,
      beta, 
      gamma,
      isTiltedForward,
      tiltDirection,
    });
  }, [onTiltChange]);

  useEffect(() => {
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permissionState = await (DeviceOrientationEvent as any).requestPermission();
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          } else {
            console.warn('Device orientation permission not granted.');
            alert('Permission for device orientation was denied.');
          }
        } catch (error) {
          console.error('Error requesting device orientation permission:', error);
          alert('Could not get permission for device orientation.');
        }
      } else {
        // For browsers that do not require explicit permission
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    };

    // Call requestPermission if it's likely an iOS device needing it.
    // Otherwise, the non-permission path in requestPermission will just add the listener.
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        requestPermission(); 
    } else {
        // For other browsers that don't require .requestPermission()
        window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  // This component is invisible, it only detects and reports tilt.
  return null; 
};

export default TiltDetector; 