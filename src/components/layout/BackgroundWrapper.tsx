import React from 'react';
import { useLocation } from 'react-router-dom';
import PixelBlast from '../PixelBlast';

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

export const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ children }) => {
  const location = useLocation();
  
  // Pages that should NOT have the PixelBlast background
  const excludedPaths = ['/', '/login', '/register', '/signin', '/signup', '/opportunities'];
  
  // Check if current path should have the background
  const shouldShowBackground = !excludedPaths.includes(location.pathname);
  
  if (!shouldShowBackground) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <PixelBlast
          variant="circle"
          pixelSize={6}
          color="#B19EEF"
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0.25}
          transparent
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};
