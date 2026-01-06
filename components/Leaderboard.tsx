import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  onReset: () => void;
  onResetRanking: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, onReset, onResetRanking }) => {
  return (
    <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg relative">
        <i className="fa-solid fa-trophy text-4xl"></i>
        {/* 리셋 버튼: 휴지통 아이콘에서 회전 화살표(리셋) 아이콘으로 변경 */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onResetRanking(); 
          }}
          className="absolute -top-2 -right-2 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-all border-4 border-white active:scale-90"
          title="순위 초기화"
        >
          <i className="fa-solid fa-arrow-rotate-left text-sm"></i>
        </button>
      </div>
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-stone-800 korean-gothic tracking-tight">명예의 전당 (Top 10)</h2>
        <p className="text-stone-400 font-bold mt-2 uppercase text-xs tracking-[0.2em]">버틴 시간이 길수록 높은 순위가 부여됩니다</p>
      </div>
      
      <div className="w-full space-y-3 mb-10">
        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center py-10 opacity-30">
            <i className="fa-solid fa-ranking-star text-6xl mb-4"></i>
            <p className="text-center text-stone-800 font-black text-xl korean-gothic">등록된 기록이 없습니다</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${index === 0 ? 'bg-stone-900 border-amber-500 scale-105 shadow-xl ring-4 ring-amber-500/20' : 'bg-stone-50 border-stone-100'}`}
            >
              <div className="flex items-center gap-5">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-500 text-stone-900' : 'bg-stone-300 text-white'}`}>
                  {index + 1}
                </span>
                <div>
                   <p className={`font-black text-2xl leading-tight ${index === 0 ? 'text-amber-400' : 'text-stone-700'}`}>{entry.name}</p>
                   <div className="flex items-center gap-2 mt-1">
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${index === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-stone-200 text-stone-500'}`}>Level</span>
                     <p className={`text-xs font-black ${index === 0 ? 'text-amber-200' : 'text-stone-500'}`}>LV {entry.level || 1}</p>
                   </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className={`font-mono font-black text-4xl italic tracking-tighter ${index === 0 ? 'text-white' : 'text-stone-800'}`}>
                    {entry.time}
                  </span>
                  <span className="text-[10px] font-black text-stone-400 uppercase">Dur</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={onReset}
        className="w-full py-6 bg-stone-800 text-white rounded-3xl font-black text-2xl hover:bg-stone-700 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
      >
        <i className="fa-solid fa-rotate-left"></i>
        다시 도전하기
      </button>
    </div>
  );
};

export default Leaderboard;