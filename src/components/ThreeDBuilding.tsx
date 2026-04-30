/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { BuildingType } from '../types';
import { BUILDING_DATA } from '../constants';
import { Building2, Coins, LayoutGrid, FlaskConical } from 'lucide-react';

interface Props {
  type: BuildingType;
  level: number;
}

export const ThreeDBuilding: React.FC<Props> = ({ type, level }) => {
  const data = BUILDING_DATA[type];
  
  // Height based on level and type
  const heightMultiplier = type === BuildingType.ROAD ? 0.1 : 0.8 + (level * 0.2);
  const baseHeight = type === BuildingType.ROAD ? 6 : 48;
  const height = baseHeight * heightMultiplier;

  const getIcon = () => {
    switch (type) {
      case BuildingType.RESIDENTIAL: return <Building2 size={24} className="text-white/80" />;
      case BuildingType.COMMERCIAL: return <Coins size={24} className="text-white/80" />;
      case BuildingType.INDUSTRIAL: return <LayoutGrid size={24} className="text-white/80" />;
      case BuildingType.RESEARCH: return <FlaskConical size={24} className="text-white/80" />;
      default: return null;
    }
  };

  if (type === BuildingType.ROAD) {
    return (
      <div className="w-full h-full bg-slate-800 relative flex items-center justify-center overflow-hidden border border-slate-700">
        <div className="w-full h-1 bg-yellow-500/30 absolute top-1/2 -translate-y-1/2 border-y border-yellow-600/20" />
        <div className="w-1 h-full bg-yellow-500/30 absolute left-1/2 -translate-x-1/2 opacity-20" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ scale: 0, y: 30 }}
      animate={{ scale: 1, y: 0 }}
      className="relative w-full h-full flex items-end justify-center pb-2"
      style={{ perspective: '1200px' }}
    >
      <div 
        className="relative w-[85%] transition-all duration-500"
        style={{ 
          height: `${height}px`,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-25deg) rotateY(25deg)',
        }}
      >
        {/* Front Face with Windows */}
        <div 
          className={`absolute inset-0 ${data.color} border border-white/20 overflow-hidden shadow-2xl`} 
          style={{ transform: 'translateZ(20px)' }} 
        >
          <div className="grid grid-cols-2 gap-1 p-1 opacity-40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-1.5 bg-cyan-200/50 rounded-sm" />
            ))}
          </div>
        </div>

        {/* Back Face */}
        <div 
          className={`absolute inset-0 ${data.color} brightness-50 border border-white/10`} 
          style={{ transform: 'translateZ(-20px)' }} 
        />

        {/* Left Side (Shadowed) */}
        <div 
          className={`absolute inset-0 ${data.color} brightness-60 border border-black/20`} 
          style={{ 
            width: '40px',
            left: '-20px',
            transform: 'rotateY(-90deg)'
          }} 
        />

        {/* Right Side */}
        <div 
          className={`absolute inset-0 ${data.color} brightness-85 border border-white/10`} 
          style={{ 
            width: '40px',
            right: '-20px',
            transform: 'rotateY(90deg)'
          }} 
        >
           <div className="grid grid-cols-1 gap-2 p-1 opacity-30 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full h-1 bg-cyan-100" />
            ))}
          </div>
        </div>

        {/* Top Face (Roof) */}
        <div 
          className={`absolute inset-0 ${data.color} brightness-150 border border-white/40 flex flex-col items-center justify-center`} 
          style={{ 
            height: '40px',
            top: '-20px',
            transform: 'rotateX(90deg)',
            boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)'
          }} 
        >
          {/* Roof detail */}
          <div className="w-2/3 h-2/3 border border-white/20 bg-black/10 flex items-center justify-center rounded-sm">
            <div className="transform rotate-[15deg]">
              {getIcon()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
