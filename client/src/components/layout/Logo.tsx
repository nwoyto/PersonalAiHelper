import React from 'react';
import logoImg from '../../assets/jibe-logo.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={logoImg} 
        alt="Jibe AI Logo" 
        style={{ 
          width: size,
          height: 'auto'
        }}
        className="object-contain"
      />
    </div>
  );
}