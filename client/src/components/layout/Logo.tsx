import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <div 
      className={`bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="text-white font-bold" style={{ fontSize: size * 0.5 }}>
        J
      </div>
    </div>
  );
}