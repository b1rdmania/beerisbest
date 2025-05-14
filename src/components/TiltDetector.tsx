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

    // It's good practice to request permission upon a user interaction, 
    // e.g., a button click. For this placeholder, we'll try on mount if not iOS.
    // On iOS, this requestPermission() MUST be triggered by a user gesture.
    // For now, let's assume the start button in Home.tsx handles the initial user gesture.
    // This component will just add the listener if permission is already implicitly available
    // or if requestPermission is not a function (non-iOS 13+ browsers).

    // A more robust solution would involve a context or prop to indicate 
    // that user interaction has occurred and it's safe to request permission.
    
    // For simplicity in this placeholder, we're not calling requestPermission() here directly.
    // The Home.tsx component would typically have a start button that triggers this.
    // For now, we'll just add the listener and assume permission will be handled.
    // This is a common pattern: a main "start experience" button handles permission.

    // Check if the event listener is already supported without explicit permission
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        window.addEventListener('deviceorientation', handleOrientation, true);
    }
    // If DeviceOrientationEvent.requestPermission IS a function, it implies iOS 13+,
    // and permission MUST be requested via a user gesture. We assume Home.tsx does this.
    // Or, a button within THIS component could call `requestPermission` if designed that way.


    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  // This component is invisible, it only detects and reports tilt.
  return null; 
};

export default TiltDetector; 