import React, { useEffect, useCallback } from 'react';

interface TiltDetectorProps {
  onTiltChange: (tiltData: { alpha: number | null; beta: number | null; gamma: number | null }) => void;
}

const TiltDetector: React.FC<TiltDetectorProps> = ({ onTiltChange }) => {
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    onTiltChange({
      alpha: event.alpha,
      beta: event.beta, 
      gamma: event.gamma,
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