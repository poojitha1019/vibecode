import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types & Constants ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 100; // ms per frame (slightly faster for glitch vibe)

const TRACKS = [
  { id: 1, title: "DATA_STREAM_01.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "CORRUPTED_SECTOR_02.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "VOID_RESONANCE_03.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

// --- Helper Functions ---
const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  const directionRef = useRef<Direction>(direction);
  const lastMoveTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Game Logic ---
  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGameStarted(true);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      e.preventDefault();
    }

    if (gameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      resetGame();
      return;
    }

    if (!isGameStarted && !gameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
       setIsGameStarted(true);
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (directionRef.current !== 'DOWN') directionRef.current = 'UP';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (directionRef.current !== 'UP') directionRef.current = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (directionRef.current !== 'RIGHT') directionRef.current = 'LEFT';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (directionRef.current !== 'LEFT') directionRef.current = 'RIGHT';
        break;
    }
  }, [isGameStarted, gameOver, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const gameLoop = useCallback((time: number) => {
    if (gameOver || !isGameStarted) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (time - lastMoveTimeRef.current >= GAME_SPEED) {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (directionRef.current) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 16); // Hex-like increments
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        setDirection(directionRef.current);
        return newSnake;
      });
      lastMoveTimeRef.current = time;
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [food, gameOver, isGameStarted]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("AUDIO_ERR:", e));
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => { setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length); setIsPlaying(true); };
  const prevTrack = () => { setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length); setIsPlaying(true); };

  return (
    <div className="min-h-screen bg-black text-[#00FFFF] font-pixel flex flex-col items-center justify-center p-4 screen-tear crt-flicker selection:bg-[#FF00FF] selection:text-black">
      <div className="static-noise"></div>
      <div className="scanlines"></div>

      {/* Header */}
      <div className="z-10 mb-8 text-center flex flex-col items-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-widest glitch-text" data-text="SNAKE.EXE">
          SNAKE.EXE
        </h1>
        <p className="text-[#FF00FF] tracking-[0.3em] text-xl mt-2 bg-[#00FFFF] text-black px-2 py-1">
          // CORRUPTED_SECTOR
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 z-10 items-center lg:items-start max-w-6xl w-full justify-center">
        
        {/* Game Container */}
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full mb-2 px-1 text-2xl">
            <div className="text-[#00FFFF]">
              MEM_ALLOC: 0x{score.toString(16).padStart(4, '0').toUpperCase()}
            </div>
            {gameOver && (
              <div className="text-[#FF00FF] animate-pulse">
                ERR_CRITICAL
              </div>
            )}
          </div>

          <div 
            className="relative bg-black border-4 border-[#FF00FF] overflow-hidden"
            style={{ 
              width: `${GRID_SIZE * 20}px`, 
              height: `${GRID_SIZE * 20}px`,
              boxShadow: gameOver ? '0 0 20px #FF00FF' : 'none'
            }}
          >
            {/* Grid Lines (Raw) */}
            <div className="absolute inset-0 opacity-20" 
                 style={{
                   backgroundImage: 'linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #00FFFF 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }}>
            </div>

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className="absolute"
                  style={{
                    left: `${segment.x * 20}px`,
                    top: `${segment.y * 20}px`,
                    width: '20px',
                    height: '20px',
                    backgroundColor: isHead ? '#FF00FF' : '#00FFFF',
                    zIndex: isHead ? 10 : 5,
                    border: '1px solid #000',
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute animate-ping"
              style={{
                left: `${food.x * 20}px`,
                top: `${food.y * 20}px`,
                width: '20px',
                height: '20px',
                backgroundColor: '#FFFFFF',
                animationDuration: '0.5s'
              }}
            />

            {/* Overlays */}
            {(!isGameStarted || gameOver) && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                <div className="text-[#00FFFF] text-3xl text-center px-4 py-4 border-2 border-[#00FFFF] bg-black">
                  {gameOver && (
                    <div className="text-[#FF00FF] font-bold text-5xl mb-4 glitch-text" data-text="FATAL_EXCEPTION">
                      FATAL_EXCEPTION
                    </div>
                  )}
                  <div className="animate-pulse">
                    AWAITING_INPUT...<br/>
                    [PRESS ANY KEY]
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-[#FF00FF] text-lg text-center max-w-[400px] tracking-widest">
            &gt; INPUT_REQ: W/A/S/D OR ARROWS<br/>
            &gt; AVOID_COLLISION: TRUE
          </div>
        </div>

        {/* Music Player */}
        <div className="w-full max-w-[400px] bg-black border-4 border-[#00FFFF] p-6 flex flex-col relative">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#FF00FF] -translate-x-1 -translate-y-1"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#FF00FF] translate-x-1 -translate-y-1"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#FF00FF] -translate-x-1 translate-y-1"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#FF00FF] translate-x-1 translate-y-1"></div>

          <div className="flex items-center justify-between mb-6 border-b-2 border-[#FF00FF] pb-2">
            <h3 className="text-[#FF00FF] text-2xl tracking-widest flex items-center gap-2">
              <div className={`w-4 h-4 bg-[#FF00FF] ${isPlaying ? 'animate-ping' : 'opacity-50'}`}></div>
              AUDIO_STREAM
            </h3>
            
            {/* Equalizer Animation */}
            <div className="flex gap-1 items-end h-8">
              {[1,2,3,4,5].map(i => (
                <div 
                  key={i} 
                  className="w-3 bg-[#00FFFF]"
                  style={{ 
                    height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                    opacity: isPlaying ? 1 : 0.5
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="text-3xl font-bold text-[#00FFFF] truncate glitch-text" data-text={TRACKS[currentTrackIndex].title}>
              {TRACKS[currentTrackIndex].title}
            </div>
            <div className="text-[#FF00FF] text-xl mt-2">
              SEQ: 0{currentTrackIndex + 1} / 0{TRACKS.length}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <button 
              onClick={prevTrack}
              className="text-[#00FFFF] hover:text-black hover:bg-[#00FFFF] border-2 border-[#00FFFF] px-4 py-2 transition-none text-2xl"
            >
              [ &lt;&lt; ]
            </button>
            
            <button 
              onClick={togglePlay}
              className="text-[#FF00FF] hover:text-black hover:bg-[#FF00FF] border-2 border-[#FF00FF] px-6 py-2 transition-none text-3xl font-bold"
            >
              {isPlaying ? '[ || ]' : '[ &gt; ]'}
            </button>
            
            <button 
              onClick={nextTrack}
              className="text-[#00FFFF] hover:text-black hover:bg-[#00FFFF] border-2 border-[#00FFFF] px-4 py-2 transition-none text-2xl"
            >
              [ &gt;&gt; ]
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex flex-col gap-2 mt-auto pt-4 border-t-2 border-[#00FFFF]">
            <div className="text-[#FF00FF] text-lg tracking-widest">SYS_VOL_LEVEL</div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-4 bg-black border-2 border-[#00FFFF] appearance-none cursor-pointer accent-[#FF00FF]"
            />
          </div>

          {/* Hidden Audio Element */}
          <audio 
            ref={audioRef} 
            src={TRACKS[currentTrackIndex].url} 
            onEnded={nextTrack}
            preload="auto"
          />
        </div>
        
      </div>
    </div>
  );
}
