import React from 'react';

// Hand-drawn line-art brain SVG (used on burgundy bands as decorative)
export const BrainLineArt = ({ className = '', color = '#F1DFC7' }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M70 55c-8-4-22 2-24 16-2 10 6 16 6 22-8 2-14 12-10 22 3 8 12 10 14 14-6 6-8 18 0 24 4 4 12 4 16 2-2 8 6 18 16 18 8 0 12-4 14-8 6 4 18 6 24-2 4-6 4-14-2-18 8-2 14-10 12-20-2-8-10-10-12-14 6-4 10-14 4-22-4-6-14-8-20-4 0-10-10-18-20-16-6 2-10 8-10 12z" />
    <path d="M100 60v90" />
    <path d="M78 82c8 2 14 6 22 6" />
    <path d="M78 108c8-2 14-6 22-6" />
    <path d="M122 82c-8 2-14 6-22 6" />
    <path d="M122 118c-8-2-14-6-22-6" />
    <path d="M88 138c4 4 10 6 16 4" />
  </svg>
);

export const BrainCircle = ({ className = '', color = '#5C1519' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 20c-3-1-8 1-9 6-1 4 2 6 2 9-3 1-5 5-3 9 1 3 4 4 5 6-2 2-3 7 1 10 2 1 5 1 6 0-1 3 2 7 6 7 4 0 5-2 6-4 3 2 7 2 9-1 2-2 2-6-1-7 3-1 5-4 4-7-1-3-4-4-5-5 2-1 4-5 1-8-2-2-5-3-7-2 0-4-4-7-8-6-2 1-4 3-4 5" />
    <path d="M32 22v22" />
    <path d="M24 30c3 1 5 2 8 2" />
    <path d="M24 40c3-1 5-2 8-2" />
    <path d="M40 30c-3 1-5 2-8 2" />
    <path d="M40 42c-3-1-5-2-8-2" />
  </svg>
);

export const HeartHand = ({ className = '', color = '#5C1519' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 46c-6-4-14-10-14-18 0-5 4-9 8-9 3 0 5 2 6 4 1-2 3-4 6-4 4 0 8 4 8 9 0 8-8 14-14 18z" />
    <path d="M18 52c4 2 8 3 14 3 6 0 10-1 14-3" />
  </svg>
);

export default { BrainLineArt, BrainCircle, HeartHand };
