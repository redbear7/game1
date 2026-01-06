
import React from 'react';
import { GameStatus } from '../types';

interface HeaderProps {
  currentLevelId: number;
  levels: { id: number }[];
  onLevelChange: (id: number) => void;
  status: GameStatus;
  themeName: string;
  cycleCount: number;
  maxCycles: number;
  elapsedTimeFormatted: string;
  isStopped: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  currentLevelId, 
  levels, 
  onLevelChange, 
  status, 
  themeName,
  cycleCount,
  maxCycles,
  elapsedTimeFormatted,
  isStopped,
}) => {
  const progressPercent = (cycleCount / maxCycles) * 100;

  return (
    <header className="w-full mb-8 space-y-4">
      {/* 레벨 네비게이션 */}
      <div className="flex justify-center flex-wrap gap-2">
        {levels.map((level) => {
          const isCompleted = status === GameStatus.PLAYING && level.id < currentLevelId;
          const isCurrent = level.id === currentLevelId;
          
          return (
            <button
              key={level.id}
              onClick={() => onLevelChange(level.id)}
              className={`
                px-4 py-2 rounded-xl font-black transition-all border-b-4 flex items-center gap-2 text-sm
                ${isCurrent 
                  ? 'bg-amber-500 text-white border-amber-700 shadow-lg scale-110 z-10' 
                  : isCompleted
                  ? 'bg-amber-100 text-amber-500 border-amber-200'
                  : 'bg-white text-stone-300 border-stone-100 hover:bg-stone-50'}
              `}
              disabled={status !== GameStatus.IDLE}
            >
              {isCompleted && <i className="fa-solid fa-check text-[10px]"></i>}
              LV {level.id}
            </button>
          );
        })}
      </div>

      {/* 메인 대시보드 */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 bg-white/60 p-2 rounded-[3.5rem] border border-white relative overflow-hidden shadow-2xl">
        {status === GameStatus.PLAYING && (
          <div 
            className="absolute bottom-0 left-0 h-1.5 bg-amber-500/30 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        )}

        {/* 좌측: 스테이지 정보 */}
        <div className="flex items-center gap-4 px-6 py-4 bg-white/80 rounded-[3rem] shadow-sm shrink-0">
          <div className="w-14 h-14 bg-stone-800 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl border-2 border-amber-500/20">
            <span className="text-2xl font-black italic">{currentLevelId}</span>
          </div>
          <div className="text-left">
            <h1 className="text-[9px] font-black text-amber-600 tracking-widest uppercase mb-1">Stage</h1>
            <p className="text-xl font-black text-stone-800 korean-gothic">{themeName}</p>
          </div>
        </div>

        {/* 중앙: 타이머 (Now centered and taking more space) */}
        <div className="flex flex-col items-center justify-center px-4 flex-grow py-2">
           <p className={`text-[10px] uppercase font-black mb-1 tracking-[0.3em] ${status === GameStatus.PAUSED ? 'text-amber-600' : isStopped ? 'text-red-500' : 'text-stone-400'}`}>
             {status === GameStatus.PAUSED ? 'PAUSED' : isStopped ? 'STOPPED' : 'ELAPSED'}
           </p>
           <p className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter leading-none italic transition-all ${status === GameStatus.PAUSED ? 'text-amber-700' : isStopped ? 'text-red-600' : 'text-stone-900'}`}>
             {elapsedTimeFormatted}
           </p>
        </div>
        
        {/* 우측: Status Indicator (Replacing Score) */}
        <div className="hidden lg:flex items-center gap-4 px-10 py-4 bg-stone-100/50 rounded-[3rem] shrink-0 border-l border-white">
           <div className={`w-3 h-3 rounded-full ${status === GameStatus.PLAYING ? 'bg-green-500 animate-pulse' : status === GameStatus.PAUSED ? 'bg-amber-500' : 'bg-stone-300'}`}></div>
           <span className="text-xs font-black text-stone-500 uppercase tracking-widest">{status}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
