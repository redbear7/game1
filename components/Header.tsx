
import React from 'react';
import { GameStatus, LeaderboardEntry } from '../types';

interface HeaderProps {
  currentLevelId: number;
  levels: { id: number }[];
  onLevelChange: (id: number) => void;
  score: number;
  status: GameStatus;
  themeName: string;
  cycleCount: number;
  maxCycles: number;
  elapsedTimeFormatted: string;
  isStopped: boolean;
  leaderboard: LeaderboardEntry[];
  topRankerName: string;
  onResetRanking: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentLevelId, 
  levels, 
  onLevelChange, 
  score, 
  status, 
  themeName,
  cycleCount,
  maxCycles,
  elapsedTimeFormatted,
  isStopped,
  leaderboard,
  topRankerName,
  onResetRanking
}) => {
  const progressPercent = (cycleCount / maxCycles) * 100;

  const handleResetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 게임 진행 중에는 초기화를 막음 (실수로 누르는 것 방지)
    if (status === GameStatus.PLAYING) {
      alert("게임 진행 중에는 순위를 초기화할 수 없습니다.");
      return;
    }
    
    onResetRanking();
  };

  return (
    <header className="w-full mb-8 space-y-4">
      {/* 최상단 랭킹 티커: 1위부터 10위까지 순위가 흐름 */}
      <div className="w-full bg-stone-900 text-amber-400 py-1.5 overflow-hidden rounded-full shadow-lg relative border border-white/10 group">
        <div className="absolute left-0 top-0 bottom-0 bg-stone-900 px-4 z-10 flex items-center border-r border-white/10">
          <i className="fa-solid fa-trophy text-xs mr-2 text-amber-500 animate-pulse"></i>
          <span className="text-[10px] font-black uppercase tracking-tighter">실시간 랭킹</span>
        </div>
        
        <div className="flex whitespace-nowrap animate-marquee group-hover:pause-marquee pl-[120px]">
          {leaderboard.length > 0 ? (
             [...leaderboard, ...leaderboard].map((entry, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 mx-6">
                  <span className="text-[10px] font-black bg-amber-500 text-stone-900 px-1.5 rounded">{(idx % leaderboard.length) + 1}위</span>
                  <span className="text-sm font-black text-white korean-gothic">{entry.name}</span>
                  <span className="text-[10px] font-bold text-stone-500">{entry.time}</span>
                </div>
             ))
          ) : (
            <div className="text-[10px] font-black text-stone-500 tracking-widest uppercase py-1">
              현재 등록된 랭킹 정보가 없습니다. 도전을 시작하여 첫 번째 영웅이 되세요!
            </div>
          )}
        </div>
      </div>

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

        {/* 중앙: 타이머 */}
        <div className="flex flex-col items-center justify-center px-4 min-w-[180px]">
           <p className={`text-[10px] uppercase font-black mb-1 tracking-[0.3em] ${status === GameStatus.PAUSED ? 'text-amber-600' : isStopped ? 'text-red-500' : 'text-stone-400'}`}>
             {status === GameStatus.PAUSED ? 'PAUSED' : isStopped ? 'STOPPED' : 'ELAPSED'}
           </p>
           <p className={`text-5xl sm:text-6xl font-black font-mono tracking-tighter leading-none italic transition-all ${status === GameStatus.PAUSED ? 'text-amber-700' : isStopped ? 'text-red-600' : 'text-stone-900'}`}>
             {elapsedTimeFormatted}
           </p>
        </div>
        
        {/* 우측: 1위 챔피언 영역 */}
        <div className="flex items-center gap-2 pr-2 flex-grow lg:flex-grow-[3] min-w-0">
          <div className="bg-stone-900 text-white rounded-[2.5rem] px-8 py-5 flex flex-col items-center justify-center min-w-[320px] flex-grow shadow-2xl border-t border-white/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none rounded-r-[2.5rem]"></div>
            
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1 whitespace-nowrap opacity-80 text-center relative z-10">Champion Hall of Fame</p>
            
            <div className="relative w-full flex items-center justify-center py-1">
              <span className="absolute left-0 text-xl font-black text-stone-600 uppercase hidden sm:block">1위</span>
              
              <div className="min-w-0 overflow-visible px-4">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 leading-tight korean-gothic drop-shadow-md whitespace-nowrap block text-center not-italic">
                  {topRankerName}
                </span>
              </div>
            </div>
          </div>

          {/* 리셋 버튼: lg 화면부터 보이도록 hidden lg:flex로 수정 및 핸들러 명시적 연결 */}
          <button 
            onClick={handleResetClick}
            className={`
              hidden lg:flex w-24 h-24 rounded-full items-center justify-center border-4 font-black transition-all rotate-12 shadow-lg shrink-0 group/reset
              ${status === GameStatus.PLAYING 
                ? 'bg-green-500 border-green-300 text-white animate-pulse cursor-default' 
                : 'bg-white border-stone-200 text-stone-300 hover:border-red-500 hover:text-red-500 active:scale-95'}
            `}
            title={status === GameStatus.PLAYING ? '게임 진행 중' : '순위 초기화'}
          >
            <div className="flex flex-col items-center transform -rotate-12">
              {status === GameStatus.PLAYING ? (
                <span className="text-xs uppercase">ON AIR</span>
              ) : (
                <>
                  <i className="fa-solid fa-rotate-left text-xl mb-1 group-hover/reset:animate-spin-slow"></i>
                  <span className="text-[10px] uppercase">RESET</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .pause-marquee {
          animation-play-state: paused;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .group-hover\/reset\:animate-spin-slow:hover i {
          animation: spin-slow 1s linear infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
