/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, RefreshCw, Trophy, Music, Gamepad2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

const TRACKS = [
  {
    title: "Neon Pulse",
    artist: "SynthAI (Generated)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "from-green-400 to-emerald-600",
    glow: "shadow-[0_0_15px_rgba(52,211,153,0.5)]"
  },
  {
    title: "Cyber Glide",
    artist: "Digital Mirage (Generated)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "from-pink-500 to-purple-600",
    glow: "shadow-[0_0_15px_rgba(236,72,153,0.5)]"
  },
  {
    title: "Synth Wave",
    artist: "Electronica AI (Generated)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "from-blue-400 to-cyan-500",
    glow: "shadow-[0_0_15px_rgba(56,189,248,0.5)]"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const getRandomCoord = useCallback(() => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  }, []);

  const spawnFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = getRandomCoord();
      // Ensure food doesn't spawn on snake
      // eslint-disable-next-line no-loop-func
      if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) break;
    }
    setFood(newFood);
  }, [getRandomCoord, snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    spawnFood();
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + nextDirection.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + nextDirection.y + GRID_SIZE) % GRID_SIZE
      };

      setDirection(nextDirection);

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        spawnFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [nextDirection, food, isGameOver, isPaused, score, highScore, spawnFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setNextDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setNextDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setNextDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setNextDirection({ x: 1, y: 0 }); break;
        case ' ': // Space to pause
          if (isGameOver) resetGame();
          else setIsPaused(p => !p);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver]);

  useEffect(() => {
    const interval = setInterval(moveSnake, INITIAL_SPEED - Math.min(score / 5, 100));
    return () => clearInterval(interval);
  }, [moveSnake, score]);

  // --- Music Controls ---
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsMusicPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsMusicPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.play().catch(() => setIsMusicPlaying(false));
    }
  }, [currentTrackIndex]);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 bg-gradient-to-br ${currentTrack.color} transition-all duration-1000`} />
        <div className={`absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 bg-gradient-to-tr ${currentTrack.color} transition-all duration-1000`} />
      </div>

      <div className="z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        
        {/* Game Window */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            {/* Retro Border effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${currentTrack.color} rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`} />
            
            <div className="relative bg-[#050505] border border-white/10 rounded-lg p-1">
              <div 
                className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-0 bg-neutral-900 overflow-hidden rounded-md"
                style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
              >
                {/* Render Grid/Snake/Food */}
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isHead = snake[0].x === x && snake[0].y === y;
                  const isSnake = snake.some(s => s.x === x && s.y === y);
                  const isFood = food.x === x && food.y === y;

                  return (
                    <div 
                      key={i} 
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        isSnake ? '' : 'border-[0.5px] border-white/5'
                      }`}
                    >
                      {isSnake && (
                        <motion.div 
                          layoutId={`snake-${isHead ? 'head' : i}`}
                          className={`w-full h-full ${
                            isHead 
                              ? `bg-gradient-to-br ${currentTrack.color} z-10 scale-110 rounded-sm ${currentTrack.glow}` 
                              : 'bg-white/10 rounded-[1px] scale-90'
                          }`}
                        />
                      )}
                      {isFood && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: [0.8, 1.2, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                        />
                      )}
                    </div>
                  );
                })}

                {/* Overlays */}
                <AnimatePresence>
                  {(isGameOver || isPaused) && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
                    >
                      {isGameOver ? (
                        <>
                          <Trophy className="w-12 h-12 text-yellow-400 mb-4" />
                          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Game Over</h2>
                          <p className="text-white/60 mb-6 uppercase text-sm tracking-widest">Score: {score}</p>
                          <button 
                            onClick={resetGame}
                            className={`px-8 py-3 bg-gradient-to-r ${currentTrack.color} text-black font-bold uppercase rounded-full tracking-widest flex items-center gap-2 hover:scale-105 transition-transform`}
                          >
                            <RefreshCw className="w-4 h-4" /> Restart
                          </button>
                        </>
                      ) : (
                        <>
                          <Gamepad2 className="w-12 h-12 text-white/50 mb-4" />
                          <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 underline underline-offset-8 decoration-emerald-500">Paused</h2>
                          <button 
                            onClick={() => setIsPaused(false)}
                            className={`px-8 py-3 border border-white/20 text-white font-bold uppercase rounded-full tracking-widest flex items-center gap-2 hover:bg-white hover:text-black transition-all`}
                          >
                            <Play className="w-4 h-4" /> Resume
                          </button>
                          <p className="mt-8 text-xs text-white/30 uppercase tracking-[0.3em]">Press Space to play</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex gap-12 text-center uppercase tracking-[0.2em] text-xs font-bold text-white/40">
            <div>
              <p className="mb-1 text-white/20">Score</p>
              <p className="text-2xl text-white font-black">{score}</p>
            </div>
            <div>
              <p className="mb-1 text-white/20">Record</p>
              <p className="text-2xl text-white font-black">{highScore}</p>
            </div>
          </div>
        </div>

        {/* Music Player Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 relative overflow-hidden group">
            {/* Visualizer bars */}
            <div className="absolute top-0 right-0 p-4 flex gap-1 items-end h-16">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isMusicPlaying ? [4, 16, 8, 20, 6] : 4 }}
                  transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: "easeInOut" }}
                  className={`w-1 bg-gradient-to-t ${currentTrack.color} rounded-full`}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${currentTrack.color} shadow-lg`}>
                  <Music className="w-5 h-5 text-black" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Now Playing</span>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black tracking-tight mb-1 truncate">{currentTrack.title}</h3>
                <p className="text-white/40 font-medium text-sm">{currentTrack.artist}</p>
              </div>

              {/* Progress */}
              <div className="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: isMusicPlaying ? '100%' : '0%' }}
                  transition={{ duration: 180, ease: "linear" }}
                  className={`h-full bg-gradient-to-r ${currentTrack.color}`}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <button onClick={prevTrack} className="p-3 text-white/60 hover:text-white hover:scale-110 transition-all">
                  <SkipBack className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={toggleMusic}
                  className={`w-16 h-16 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 transition-transform shadow-xl`}
                >
                  {isMusicPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black translate-x-0.5" />}
                </button>

                <button onClick={nextTrack} className="p-3 text-white/60 hover:text-white hover:scale-110 transition-all">
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Volume indication */}
              <div className="mt-8 flex items-center gap-4 text-white/20">
                <Volume2 className="w-4 h-4" />
                <div className="flex-1 h-[2px] bg-white/10 rounded-full" />
              </div>
            </div>

            {/* Background disc shadow */}
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${currentTrack.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
          </div>

          <div className="p-6 border border-white/5 bg-white/[0.02] rounded-xl text-[11px] text-white/30 uppercase leading-relaxed tracking-widest">
            <p className="mb-4 text-white/50 font-bold border-b border-white/10 pb-2">How to Play</p>
            <ul className="space-y-2">
              <li>• Use Arrow Keys to navigate</li>
              <li>• Collect <span className="text-pink-500 font-bold">Pink Orbs</span></li>
              <li>• Space to Pause / Restart</li>
              <li>• Don't hit yourself!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={nextTrack}
        hidden
      />

      {/* Footer Branding */}
      <div className="mt-12 text-[10px] text-white/10 uppercase tracking-[1em] font-medium flex items-center gap-4">
        <div className="w-12 h-[1px] bg-white/10" />
        SynthSnake & Beats v1.0
        <div className="w-12 h-[1px] bg-white/10" />
      </div>
    </div>
  );
}

