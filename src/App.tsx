/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Settings, 
  Play, 
  BookOpen, 
  Save, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Users, 
  Coins, 
  FlaskConical,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  Volume2,
  VolumeX,
  Music
} from 'lucide-react';
import { BuildingType, ViewState, Building, ResourceState, GameSave, GameSettings, Citizen } from './types';
import { BUILDING_DATA, GRID_SIZE, TECH_TREE, REBIRTH_PERKS } from './constants';
import { ThreeDBuilding } from './components/ThreeDBuilding';
import { ThreeDCitizen } from './components/ThreeDCitizen';
import { useAudio } from './hooks/useAudio';

const INITIAL_RESOURCES: ResourceState = {
  money: 500,
  population: 0,
  researchPoints: 0,
  unlockedTech: [],
};

export default function App() {
  const [view, setView] = useState<ViewState>('menu');
  const [resources, setResources] = useState<ResourceState>(INITIAL_RESOURCES);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [rebirthLevel, setRebirthLevel] = useState(0);
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({
    musicVolume: 0.5,
    sfxVolume: 0.8,
    isMuted: false,
  });

  const { isPlaying, toggle, startAudio, setAudioVolume } = useAudio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', settings.musicVolume);

  // Auto-play music on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!settings.isMuted) {
        startAudio();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [settings.isMuted, startAudio]);

  useEffect(() => {
    setAudioVolume(settings.isMuted ? 0 : settings.musicVolume);
  }, [settings.musicVolume, settings.isMuted, setAudioVolume]);

  // Load saves on mount
  useEffect(() => {
    const stored = localStorage.getItem('polis_saves');
    if (stored) {
      setSaves(JSON.parse(stored));
    }
  }, []);

  // Save games helper
  const saveGame = () => {
    const newSave: GameSave = {
      id: selectedSaveId || Math.random().toString(36).substr(2, 9),
      name: `City ${new Date().toLocaleDateString()}`,
      resources,
      buildings,
      rebirthLevel,
      lastPlayed: Date.now(),
    };
    const updatedSaves = [...saves.filter(s => s.id !== newSave.id), newSave];
    setSaves(updatedSaves);
    localStorage.setItem('polis_saves', JSON.stringify(updatedSaves));
    setSelectedSaveId(newSave.id);
  };

  const startNewGame = () => {
    setResources(INITIAL_RESOURCES);
    setBuildings([]);
    setCitizens([]);
    setRebirthLevel(0);
    setSelectedSaveId(null);
    setView('playing');
  };

  const loadGame = (save: GameSave) => {
    setResources(save.resources);
    setBuildings(save.buildings);
    setCitizens([]); // Reset citizens on load
    setRebirthLevel(save.rebirthLevel);
    setSelectedSaveId(save.id);
    setView('playing');
  };

  const startTutorial = () => {
    startNewGame();
    setView('tutorial');
    setTutorialStep(1);
  };

  // Game Loop: Income generation
  useEffect(() => {
    if (view !== 'playing' && view !== 'tutorial') return;

    const interval = setInterval(() => {
      setResources(prev => {
        let moneyDelta = 0;
        let popDelta = 0;
        let researchDelta = 0;

        buildings.forEach(b => {
          const data = BUILDING_DATA[b.type];
          moneyDelta += data.moneyGen * (1 + b.level * 0.5);
          popDelta += data.popGen;
          if (b.type === BuildingType.RESEARCH) researchDelta += 1;
        });

        // Apply rebirth bonus
        const multiplier = 1 + (rebirthLevel * 0.1);
        
        return {
          ...prev,
          money: prev.money + (moneyDelta * multiplier),
          population: Math.max(0, prev.population + popDelta),
          researchPoints: prev.researchPoints + researchDelta,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [view, buildings, rebirthLevel]);

  // Citizen Logic: Spawning and Movement
  useEffect(() => {
    if (view !== 'playing' && view !== 'tutorial') return;

    const spawnInterval = setInterval(() => {
      setCitizens(prev => {
        // Desired number of citizens based on population (1 per 50 people, max 20)
        const desiredCount = Math.min(20, Math.floor(resources.population / 50));
        
        if (prev.length < desiredCount && buildings.length > 0) {
          // Spawn at a random building
          const startBuilding = buildings[Math.floor(Math.random() * buildings.length)];
          const newCitizen: Citizen = {
            id: Math.random().toString(36).substr(2, 9),
            x: startBuilding.x,
            y: startBuilding.y,
            targetX: startBuilding.x,
            targetY: startBuilding.y,
            progress: 1,
          };
          return [...prev, newCitizen];
        }
        
        if (prev.length > desiredCount && prev.length > 0) {
          // Remove a citizen
          return prev.slice(1);
        }

        return prev;
      });
    }, 5000);

    const moveInterval = setInterval(() => {
      setCitizens(prev => prev.map(c => {
        if (c.progress >= 1) {
          // Choose a new target
          if (buildings.length === 0) return c;
          const target = buildings[Math.floor(Math.random() * buildings.length)];
          return {
            ...c,
            x: c.targetX,
            y: c.targetY,
            targetX: target.x,
            targetY: target.y,
            progress: 0,
          };
        }
        return { ...c, progress: Math.min(1, c.progress + 0.05) };
      }));
    }, 100);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [view, resources.population, buildings]);

  const placeBuilding = (x: number, y: number) => {
    if (!selectedBuildingType) return;
    const cost = BUILDING_DATA[selectedBuildingType].cost;
    if (resources.money < cost) return;

    // Check if space is occupied
    if (buildings.find(b => b.x === x && b.y === y)) return;

    const newBuilding: Building = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedBuildingType,
      x,
      y,
      level: 1,
    };

    setBuildings([...buildings, newBuilding]);
    setResources(prev => ({ ...prev, money: prev.money - cost }));

    if (view === 'tutorial' && tutorialStep === 1) {
      setTutorialStep(2);
    }
  };

  const [showResearch, setShowResearch] = useState(false);
  const [showRebirth, setShowRebirth] = useState(false);

  const upgradeBuilding = (id: string) => {
    const b = buildings.find(b => b.id === id);
    if (!b) return;
    const cost = BUILDING_DATA[b.type].cost * (b.level + 1);
    if (resources.money < cost) return;

    setBuildings(buildings.map(item => item.id === id ? { ...item, level: item.level + 1 } : item));
    setResources(prev => ({ ...prev, money: prev.money - cost }));
  };

  const unlockTech = (techId: string) => {
    const tech = TECH_TREE.find(t => t.id === techId);
    if (!tech || resources.researchPoints < tech.cost || resources.unlockedTech.includes(techId)) return;

    setResources(prev => ({
      ...prev,
      researchPoints: prev.researchPoints - tech.cost,
      unlockedTech: [...prev.unlockedTech, techId]
    }));
  };

  const rebirthRequirement = useMemo(() => Math.floor(500 * Math.pow(1.8, rebirthLevel)), [rebirthLevel]);

  const performRebirth = () => {
    if (resources.population < rebirthRequirement) return; // Dynamic requirement
    setRebirthLevel(prev => prev + 1);
    setBuildings([]);
    setResources(INITIAL_RESOURCES);
    setCitizens([]);
    setShowRebirth(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-screen flex flex-col items-center justify-center bg-slate-900"
          >
            {/* Background Decoration (Cityscape Silhouette) */}
            <div className="absolute bottom-0 w-full h-64 flex items-end justify-center gap-1 opacity-20 pointer-events-none">
              <div className="w-12 h-48 bg-slate-500"></div>
              <div className="w-16 h-64 bg-slate-400"></div>
              <div className="w-20 h-32 bg-slate-600"></div>
              <div className="w-14 h-56 bg-slate-500"></div>
              <div className="w-24 h-40 bg-slate-400"></div>
              <div className="w-10 h-60 bg-slate-600"></div>
              <div className="w-16 h-48 bg-slate-500"></div>
              <div className="w-12 h-32 bg-slate-600"></div>
            </div>

            {/* Top Banner / Navigation Labels */}
            <div className="absolute top-8 left-8 flex items-center gap-4">
              <div className="px-3 py-1 bg-yellow-400 text-slate-900 text-[10px] font-black rounded uppercase tracking-widest">Version 1.0.4</div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Studio Polis Interactive</div>
            </div>

            {/* Visual Polish: Subtle grid */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" 
              style={{ 
                backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
              }} 
            />
            
            <div className="relative z-10 text-center space-y-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                <div className="relative inline-block">
                  <h1 className="text-9xl md:text-[12rem] font-black tracking-tighter leading-none uppercase filter drop-shadow-2xl select-none text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-emerald-400 to-emerald-600">
                    POLIS
                  </h1>
                  <motion.div 
                    initial={{ rotate: 0, scale: 0 }}
                    animate={{ rotate: 12, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -top-4 -right-8 bg-rose-500 text-white px-3 py-1 text-sm font-black rounded shadow-lg"
                  >
                    BUILDER
                  </motion.div>
                </div>
                <p className="text-cyan-200/60 mt-6 text-sm font-medium tracking-[0.4em] uppercase">The Ultimate Urban Strategy</p>
              </motion.div>

              <div className="flex flex-col items-center gap-5 pt-8">
                <button 
                  onClick={startNewGame}
                  className="group relative w-72 px-8 py-5 bg-emerald-500 rounded-xl text-white font-black text-xl shadow-[0_6px_0_rgb(5,150,105)] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_rgb(5,150,105)] active:translate-y-2 active:shadow-none"
                >
                  NEW CITY
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button 
                  onClick={() => setView('load_game')}
                  className="w-72 px-8 py-5 bg-cyan-600 rounded-xl text-white font-black text-xl shadow-[0_6px_0_rgb(8,145,178)] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_rgb(8,145,178)] active:translate-y-2 active:shadow-none"
                >
                  CONTINUE
                </button>

                <div className="flex gap-4 w-72">
                  <button 
                    onClick={startTutorial}
                    className="flex-1 px-4 py-4 bg-slate-700 rounded-xl text-slate-300 font-bold text-base border-2 border-slate-600 hover:bg-slate-600 transition-colors"
                  >
                    TUTORIAL
                  </button>
                  <button 
                    onClick={() => setView('settings')}
                    className="p-4 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    <Settings size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Bar labels */}
            <div className="absolute bottom-8 left-0 w-full px-8 flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <div className="flex gap-8">
                <span>Current Version: 1.0.4-LTS</span>
                <span className="text-emerald-500/50">Global Rank: #4,209</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span>Server Online</span>
              </div>
            </div>
          </motion.div>
        )}

        {(view === 'playing' || view === 'tutorial') && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen overflow-hidden bg-slate-900"
          >
            {/* Top Bar Resources */}
            <div className="absolute top-0 left-0 right-0 z-20 h-16 bg-slate-900/90 backdrop-blur-md border-b-2 border-slate-800 flex items-center justify-between px-8">
              <div className="flex items-center gap-8">
                <Stat icon={<Coins className="text-yellow-400" />} value={Math.floor(resources.money).toLocaleString()} label="Budget" />
                <Stat icon={<Users className="text-emerald-400" />} value={resources.population.toLocaleString()} label="Citizens" />
                <Stat icon={<FlaskConical className="text-cyan-400" />} value={resources.researchPoints} label="Tech" />
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowRebirth(true)}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-black transition-all shadow-[0_3px_0_rgb(190,18,60)] hover:translate-y-0.5 hover:shadow-[0_1px_0_rgb(190,18,60)] active:translate-y-1 active:shadow-none uppercase tracking-tighter"
                >
                  PRESTIGE
                </button>
                <button 
                  onClick={saveGame}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  <Save size={20} />
                </button>
                <button 
                  onClick={() => setView('menu')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 text-rose-400"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            {/* Main Game Stage */}
            <div className="flex-1 relative overflow-auto pt-16 bg-slate-900 shadow-inner">
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
              
              <div 
                className="grid gap-1.5 p-32 relative" 
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  width: 'fit-content',
                  margin: '0 auto'
                }}
              >
                {/* Render Citizens */}
                {citizens.map(citizen => (
                  <ThreeDCitizen 
                    key={citizen.id}
                    progress={citizen.progress}
                    x={citizen.x}
                    y={citizen.y}
                    targetX={citizen.targetX}
                    targetY={citizen.targetY}
                  />
                ))}

                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const building = buildings.find(b => b.x === x && b.y === y);
                  
                  return (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      onClick={() => {
                        if (building) {
                          upgradeBuilding(building.id);
                        } else {
                          placeBuilding(x, y);
                        }
                      }}
                      className={`
                        w-16 h-16 border rounded-sm transition-all cursor-pointer relative group flex items-center justify-center overflow-visible
                        ${building ? `bg-transparent border-white/5` : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/60'}
                      `}
                    >
                      {building && (
                        <>
                          <ThreeDBuilding type={building.type} level={building.level} />
                          <div className="absolute -bottom-1 -right-1 bg-white text-slate-900 text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-full shadow-sm z-20">{building.level}</div>
                          <div className="hidden group-hover:flex absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900/95 p-3 rounded-xl border-2 border-slate-700 whitespace-nowrap z-50 flex-col items-center shadow-2xl backdrop-blur-sm">
                            <span className="text-xs font-black uppercase text-white">{BUILDING_DATA[building.type].name}</span>
                            <span className="text-[10px] font-bold text-emerald-400">Upgrade: ${BUILDING_DATA[building.type].cost * (building.level + 1)}</span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* HUD / Construction Menu */}
            <div className="w-80 bg-slate-800/90 backdrop-blur-xl border-l-2 border-slate-700 h-full flex flex-col pt-16 shadow-2xl">
              <div className="p-6 overflow-y-auto">
                <h3 className="uppercase text-[10px] font-black text-slate-400 mb-6 tracking-[0.2em] flex items-center gap-2">
                   CONSTRUCTION HUB
                </h3>
                
                <div className="space-y-4">
                  {(Object.keys(BuildingType) as Array<keyof typeof BuildingType>).map((key) => {
                    const type = BuildingType[key];
                    const data = BUILDING_DATA[type];
                    const isSelected = selectedBuildingType === type;
                    const canAfford = resources.money >= data.cost;

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedBuildingType(type)}
                        className={`
                          w-full p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group
                          ${isSelected ? 'bg-slate-700 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-slate-900/50 border-transparent hover:bg-slate-700 hover:border-slate-600'}
                          ${!canAfford ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-black text-xs uppercase tracking-tight text-white">{data.name}</span>
                          <span className="font-black text-xs text-emerald-400">${data.cost}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                          {data.description}
                        </p>
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Research & Rebirth Sections */}
              <div className="mt-auto border-t-2 border-slate-700 p-6 space-y-6">
                <button 
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-[0_4px_0_rgb(8,145,178)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(8,145,178)] active:translate-y-1 active:shadow-none uppercase"
                  onClick={() => setShowResearch(true)}
                >
                  ENGINEERING
                </button>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-rose-400 uppercase tracking-tighter">
                    <span>Prestige Rank</span>
                    <span>LV.{rebirthLevel}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-600 to-orange-400 transition-all duration-1000"
                      style={{ width: `${Math.min(100, (resources.population / rebirthRequirement) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 italic opacity-80">Next Ascension: {rebirthRequirement} Population</p>
                </div>
              </div>
            </div>

            {/* Research Modal */}
            <AnimatePresence>
              {showResearch && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-8"
                >
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                      <h2 className="text-3xl font-bold tracking-tighter uppercase">Tech Tree</h2>
                      <button onClick={() => setShowResearch(false)} className="p-2 hover:bg-white/10 rounded-full">
                        <Trash2 size={24} className="rotate-45" />
                      </button>
                    </div>
                    <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                      {TECH_TREE.map(tech => {
                        const isUnlocked = resources.unlockedTech.includes(tech.id);
                        const canAfford = resources.researchPoints >= tech.cost;
                        const isAvailable = tech.required.every(rid => resources.unlockedTech.includes(rid));

                        return (
                          <div 
                            key={tech.id}
                            className={`p-6 rounded-2xl border transition-all ${isUnlocked ? 'bg-indigo-600/20 border-indigo-500/40' : 'bg-white/5 border-white/5'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold">{tech.name}</h4>
                                <p className="text-xs text-white/50">{tech.unlocks}</p>
                              </div>
                              <span className="font-mono text-xs text-purple-400">{tech.cost} RP</span>
                            </div>
                            {!isUnlocked && isAvailable && (
                              <button
                                onClick={() => unlockTech(tech.id)}
                                disabled={!canAfford}
                                className={`mt-4 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${canAfford ? 'bg-purple-600 hover:bg-purple-500' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                              >
                                Unlock
                              </button>
                            )}
                            {isUnlocked && <span className="text-[10px] uppercase font-bold text-indigo-400 mt-2 block">RESEARCHED</span>}
                            {!isAvailable && !isUnlocked && <span className="text-[10px] uppercase font-bold text-white/20 mt-2 block italic">LOCKED (Prerequisite required)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rebirth Modal */}
            <AnimatePresence>
              {showRebirth && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-8"
                >
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-md p-8 text-center space-y-6">
                    <h2 className="text-4xl font-bold tracking-tighter uppercase italic">Rebirth</h2>
                    <p className="text-sm font-mono text-white/50">
                      Reset your current city to gain permanent bonuses. Each prestige level increases all future income by <span className="text-indigo-400">10%</span>.
                    </p>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-xs font-mono uppercase text-white/30 mb-1">Current Population</div>
                      <div className={`text-2xl font-bold ${resources.population >= rebirthRequirement ? 'text-green-400' : 'text-red-400'}`}>
                        {resources.population} / {rebirthRequirement}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowRebirth(false)}
                        className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={performRebirth}
                        disabled={resources.population < rebirthRequirement}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${resources.population >= rebirthRequirement ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                      >
                        Ascend
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tutorial Overlay */}
            {view === 'tutorial' && (
              <div className="absolute inset-x-0 bottom-12 flex justify-center z-50 pointer-events-none">
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="bg-indigo-600 text-white p-6 rounded-2xl shadow-2xl max-w-md border border-white/20 pointer-events-auto"
                >
                  <h4 className="font-bold mb-2 flex items-center gap-2 uppercase tracking-tighter">
                    <BookOpen size={18} /> Tutorial: Part {tutorialStep}
                  </h4>
                  <p className="text-sm font-mono opacity-90">
                    {tutorialStep === 1 && "Start by building a 'Block Apartment' on the grid. This will house your first citizens!"}
                    {tutorialStep === 2 && "Great! Now select a 'Mini Mart' to provide services and start generating municipal revenue."}
                  </p>
                  <div className="mt-4 flex justify-end">
                    {tutorialStep > 2 && (
                      <button 
                        onClick={() => setView('playing')}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold uppercase"
                      >
                        Start Playing!
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-8"
          >
            <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic text-cyan-400">Settings</h2>
                <button onClick={() => setView('menu')} className="text-slate-400 hover:text-white">
                  <RotateCcw size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Audio Controls */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <Music size={16} /> Background Music
                     </span>
                     <button 
                       onClick={toggle}
                       className={`px-4 py-1 rounded-full text-[10px] font-black uppercase transition-all ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'}`}
                     >
                       {isPlaying ? 'Playing' : 'Paused'}
                     </button>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={settings.musicVolume}
                    onChange={(e) => setSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <Volume2 size={16} /> Sound Effects
                     </span>
                     <span className="text-xs font-mono font-bold text-slate-500">{(settings.sfxVolume * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={settings.sfxVolume}
                    onChange={(e) => setSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Mute Toggle */}
                <button 
                  onClick={() => setSettings({ ...settings, isMuted: !settings.isMuted })}
                  className={`w-full py-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${settings.isMuted ? 'border-rose-500/50 bg-rose-500/10 text-rose-500' : 'border-slate-700 bg-slate-900/50 text-slate-400'}`}
                >
                  {settings.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  <span className="font-black uppercase tracking-widest text-sm">
                    {settings.isMuted ? 'All Sound Muted' : 'Sound Enabled'}
                  </span>
                </button>
              </div>

              <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Changes are saved automatically to local sector
              </p>
            </div>
          </motion.div>
        )}
        {view === 'load_game' && (
          <motion.div 
            key="loads"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-8"
          >
            <div className="bg-slate-800/80 backdrop-blur-md border-2 border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
              <div className="p-8 border-b-2 border-slate-700 flex justify-between items-center bg-slate-800/50">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic text-cyan-400">Archived Polises</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Select A Sector To Deploy</span>
                </div>
                <button onClick={() => setView('menu')} className="p-3 bg-slate-700 hover:bg-rose-500 transition-colors rounded-xl text-white shadow-lg">
                  <RotateCcw size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {saves.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-slate-600 font-black uppercase tracking-widest text-sm italic mb-2">No Active Data-Logs Found</div>
                    <p className="text-slate-500 text-xs font-bold font-mono">Create a New City to begin colonization.</p>
                  </div>
                ) : (
                  saves.map(save => (
                    <button
                      key={save.id}
                      onClick={() => loadGame(save)}
                      className="w-full p-5 text-left bg-slate-900/50 border-2 border-slate-700 hover:bg-slate-700 hover:border-cyan-500/50 rounded-2xl group transition-all flex gap-6"
                    >
                      <div className="w-20 h-20 bg-slate-800 rounded-xl flex-shrink-0 grid grid-cols-2 gap-1 p-1.5 overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity border border-white/5">
                        <div className="bg-emerald-400"></div><div className="bg-slate-600"></div>
                        <div className="bg-slate-600"></div><div className="bg-emerald-500"></div>
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xl font-black text-white uppercase tracking-tight">{save.name}</span>
                          <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all text-cyan-400" />
                        </div>
                        <div className="flex gap-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          <span className="text-emerald-400">${Math.floor(save.resources.money)}</span>
                          <span className="text-cyan-400">{save.resources.population} POP</span>
                          <span>Last Activity: {new Date(save.lastPlayed).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Progress Summary in Load Screen */}
              {saves.length > 0 && (
                <div className="p-8 bg-slate-900/50 border-t-2 border-slate-700 px-12">
                   <div className="flex justify-between text-[10px] font-black text-orange-400 uppercase tracking-tighter mb-2">
                    <span>Global Rebirth Progress</span>
                    <span>{Math.min(100, (saves.reduce((acc, s) => acc + s.resources.population, 0) / 1000) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-600 to-yellow-400" style={{ width: `${Math.min(100, (saves.reduce((acc, s) => acc + s.resources.population, 0) / 1000) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative w-64 md:w-80 py-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all rounded-2xl flex items-center justify-between px-8"
    >
      <span className="flex items-center gap-4 text-lg font-bold tracking-tight">
        <span className="opacity-50 group-hover:opacity-100 group-hover:text-indigo-400 transition-all">{icon}</span>
        {label}
      </span>
      <ChevronRight size={20} className="opacity-0 group-hover:opacity-50 transition-opacity" />
      <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-2xl transition-all" />
    </motion.button>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode, value: number | string, label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2.5 bg-slate-800 rounded-xl border-2 border-slate-700 shadow-md transform -rotate-3">{icon}</div>
      <div className="flex flex-col -space-y-1.5">
        <span className="text-xl font-black font-sans tracking-tighter tabular-nums leading-none text-white">{value}</span>
        <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">{label}</span>
      </div>
    </div>
  );
}

function BuildingIcon({ type }: { type: BuildingType }) {
  switch (type) {
    case BuildingType.RESIDENTIAL: return <Building2 size={24} className="text-white/80" />;
    case BuildingType.COMMERCIAL: return <Coins size={24} className="text-white/80" />;
    case BuildingType.INDUSTRIAL: return <LayoutGrid size={24} className="text-white/80" />;
    case BuildingType.RESEARCH: return <FlaskConical size={24} className="text-white/80" />;
    case BuildingType.ROAD: return <div className="w-10 h-2 bg-white/20 rotate-45" />;
    case BuildingType.POWER: return <div className="text-xl font-bold">⚡</div>;
    default: return <Plus size={20} />;
  }
}
