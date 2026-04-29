import React from 'react';

export default function Logo({ width = "100%", height = "auto", className = "", style = {} }) {
  return (
    <img 
      src="/logo.png" 
      alt="SkillSwap Logo" 
      width={width} 
      height={height} 
      className={className}
      style={{ objectFit: 'contain', ...style }} 
    />
  );
}
