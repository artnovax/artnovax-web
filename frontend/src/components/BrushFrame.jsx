import React from 'react';

// Reusable brush-frame image component with organic mask + burgundy paint outline
const BrushFrame = ({ src, alt, className = '', aspect = 'aspect-[4/3]', objectPosition = 'center' }) => {
  return (
    <div className={`brush-frame relative ${aspect} ${className}`}>
      <img src={src} alt={alt} style={{ objectPosition }} />
    </div>
  );
};

export default BrushFrame;
