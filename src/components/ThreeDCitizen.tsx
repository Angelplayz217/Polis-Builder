/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface Props {
  progress: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export const ThreeDCitizen: React.FC<Props> = ({ progress, x, y, targetX, targetY }) => {
  // Interpolate position
  const currentX = x + (targetX - x) * progress;
  const currentY = y + (targetY - y) * progress;

  // Jump animation for walking
  const jumpHeight = Math.sin(progress * Math.PI) * 4;

  return (
    <motion.div 
      className="absolute z-30 pointer-events-none"
      style={{ 
        left: `${currentX * 64 + 32}px`, 
        top: `${currentY * 64 + 32}px`,
        transform: 'translate(-50%, -50%)',
        perspective: '1000px'
      }}
    >
      <div 
        className="relative transition-all duration-300"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-20deg) rotateY(25deg)',
          marginBottom: `${jumpHeight}px`
        }}
      >
        {/* Head (3D Cube) */}
        <div 
          className="absolute bg-[#FFE0BD] border border-black/10" 
          style={{ 
            width: '10px', 
            height: '10px', 
            top: '-24px', 
            left: '0px',
            transform: 'translateZ(5px)' 
          }} 
        />
        <div 
          className="absolute bg-[#E0C0A0]" 
          style={{ 
            width: '10px', 
            height: '10px', 
            top: '-24px', 
            left: '5px',
            transform: 'rotateY(90deg)' 
          }} 
        />
        
        {/* Body (3D Cube) */}
        <div 
          className="absolute bg-indigo-500 border border-black/10" 
          style={{ 
            width: '12px', 
            height: '16px', 
            top: '-14px', 
            left: '-1px',
            transform: 'translateZ(6px)' 
          }} 
        />
        <div 
          className="absolute bg-indigo-600" 
          style={{ 
            width: '12px', 
            height: '16px', 
            top: '-14px', 
            left: '5px',
            transform: 'rotateY(90deg)' 
          }} 
        />

        {/* Legs */}
        <div 
          className="absolute bg-slate-900 border border-black/10" 
          style={{ 
            width: '12px', 
            height: '6px', 
            top: '2px', 
            left: '-1px',
            transform: 'translateZ(6px)' 
          }} 
        />
        <div 
          className="absolute bg-black" 
          style={{ 
            width: '12px', 
            height: '6px', 
            top: '2px', 
            left: '5px',
            transform: 'rotateY(90deg)' 
          }} 
        />
      </div>
    </motion.div>
  );
};
