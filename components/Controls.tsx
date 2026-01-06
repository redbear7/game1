
import React, { useState, useRef } from 'react';
import { GameStatus } from '../types';
import { MIN_BPM, MAX_BPM, DEFAULT_BPM } from '../constants';

interface ControlsProps {
  status: GameStatus;
  bpm: number;
  setBpm: (bpm: number) => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onThemeChange: (theme: string) => void;
  onAudioUpload: (file: File) => void;
  audioName: string | null;
  isAudioSynced: boolean;
  setIsAudioSynced: (sync: boolean) => void;
  levelDelays: number[];
  updateDelay: (index: number, val: number) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onSaveCurrent: () => void;
  onSaveAudioToDevice: () => void;
  onResetAudio: () => void;
  loading: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  status, 
  bpm, 
  setBpm, 
  onStart, 
  onStop, 
  onPause,
  onResume,
  onThemeChange,
  onAudioUpload,
  audioName,
  isAudioSynced,
  setIsAudioSynced,
  levelDelays,
  updateDelay,
  onExport,
  onImport,
  onSaveCurrent,
  onSaveAudioToDevice,
  onResetAudio,
  loading
}) => {
  const [themeInput, setThemeInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAudioUpload(file);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    if (e.target) e.target.value = ''; 
  };

  return (
    <div className="w-full max-w-4xl space-y-6 mt-8 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-2xl space-y-6">
        
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-4 min-w-[320px] flex-grow">
            <div className="flex flex-wrap items-center gap-3">
              {status === GameStatus.IDLE ? (
                <button 
                  onClick={onStart}
                  className="px-12 py-5 bg-stone-800 text-white rounded-2xl font-black shadow-xl hover:bg-stone-700 active:scale-95 transition-all flex items-center gap-3 text-2xl"
                >
                  <i className="fa-solid fa-play"></i>
                  도전 시작
                </button>
              ) : status === GameStatus.PAUSED ? (
                <button 
                  onClick={onResume}
                  className="px-12 py-5 bg-amber-500 text-white rounded-2xl font-black shadow-xl hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-3 text-2xl"
                >
                  <i className="fa-solid fa-play"></i>
                  계속하기
                </button>
              ) : (
                <div className="flex gap-2">
                   <button 
                    onClick={onPause}
                    className="px-8 py-5 bg-stone-500 text-white rounded-2xl font-black shadow-xl hover:bg-stone-600 active:scale-95 transition-all flex items-center gap-3 text-2xl"
                  >
                    <i className="fa-solid fa-pause"></i>
                  </button>
                  <button 
                    onClick={onStop}
                    className="px-12 py-5 bg-red-500 text-white rounded-2xl font-black shadow-xl hover:bg-red-600 active:scale-95 transition-all flex items-center gap-3 text-2xl"
                  >
                    <i className="fa-solid fa-stop"></i>
                    중단
                  </button>
                </div>
              )}

              <div className="flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-l-2xl font-black transition-all border-2 ${audioName && audioName !== '기본 배경음악' ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white border-stone-200 text-stone-400 hover:border-amber-200'}`}
                  title="BGM 업로드"
                  disabled={status !== GameStatus.IDLE}
                >
                  <i className="fa-solid fa-music text-xl"></i>
                </button>
                <button 
                  onClick={onSaveCurrent}
                  className="px-4 bg-stone-800 text-amber-400 border-y-2 border-stone-800 hover:bg-stone-900 transition-all"
                  title="현재 설정 저장"
                  disabled={status !== GameStatus.IDLE}
                >
                  <i className="fa-solid fa-save text-sm"></i>
                </button>
                <button 
                  onClick={onResetAudio}
                  className="px-4 bg-stone-100 text-stone-400 border-2 border-stone-200 rounded-r-2xl hover:bg-stone-200 transition-all"
                  title="음원 초기화"
                  disabled={status !== GameStatus.IDLE}
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
            </div>
            
            <div className="flex flex-col gap-2 px-2 bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                   <div 
                    className="flex items-center gap-2 select-none cursor-pointer" 
                    onClick={() => status === GameStatus.IDLE && setIsAudioSynced(!isAudioSynced)}
                   >
                    <span className="text-[10px] font-black text-stone-400 uppercase">Intro Sync</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isAudioSynced ? 'bg-amber-500' : 'bg-stone-300'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isAudioSynced ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                   </div>
                   <span className="text-[10px] font-black text-stone-400 uppercase">Level Delays (SEC)</span>
                </div>
                
                {isAudioSynced && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                    {levelDelays.map((delay, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <label className="text-[8px] font-bold text-stone-400 mb-1">D{idx+1}</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          value={delay} 
                          onChange={(e) => updateDelay(idx, parseFloat(e.target.value) || 0)} 
                          className="w-full bg-white text-center font-black text-stone-700 outline-none rounded-md border border-stone-200 text-[10px] py-1 shadow-sm" 
                          disabled={status !== GameStatus.IDLE} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:max-w-md bg-stone-100/50 p-5 rounded-[2rem] border border-stone-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-stone-400 tracking-widest uppercase">Rhythm BPM</span>
                <button 
                  onClick={() => setBpm(DEFAULT_BPM)}
                  className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full hover:bg-amber-600 transition-colors uppercase"
                  disabled={status !== GameStatus.IDLE}
                >
                  Reset (182)
                </button>
              </div>
              <span className="text-2xl font-black text-amber-600 italic">{bpm}</span>
            </div>
            <input 
              type="range" 
              min={MIN_BPM} 
              max={MAX_BPM} 
              value={bpm} 
              onChange={(e) => setBpm(parseInt(e.target.value))} 
              className="w-full h-3 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500 shadow-inner" 
              disabled={status !== GameStatus.IDLE} 
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <input 
            type="text" 
            placeholder="주제를 입력해 AI로 단어를 생성하세요" 
            value={themeInput} 
            onChange={(e) => setThemeInput(e.target.value)} 
            className="flex-grow px-6 py-4 rounded-2xl border-4 font-bold outline-none transition-all shadow-inner bg-white border-amber-200 hover:border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
            disabled={status !== GameStatus.IDLE} 
          />
          <button 
            onClick={() => { if (themeInput.trim()) { onThemeChange(themeInput); setThemeInput(''); } }} 
            disabled={!themeInput.trim() || status !== GameStatus.IDLE || loading} 
            className="px-10 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 disabled:opacity-50 transition-all shadow-lg active:translate-y-1 flex items-center gap-2 py-4"
          >
            {loading && <i className="fa-solid fa-spinner animate-spin"></i>}
            AI 생성
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
        <button 
          onClick={onSaveCurrent}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-md active:scale-95"
          disabled={status !== GameStatus.IDLE}
        >
          <i className="fa-solid fa-floppy-disk"></i>
          현재 설정 저장
        </button>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-5 py-3 bg-white/60 border border-white rounded-2xl text-stone-500 font-bold text-sm hover:bg-white/80 transition-all shadow-sm"
          disabled={status !== GameStatus.IDLE}
        >
          <i className="fa-solid fa-file-export"></i>
          내보내기
        </button>
        <button 
          onClick={() => jsonInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-3 bg-white/60 border border-white rounded-2xl text-stone-500 font-bold text-sm hover:bg-white/80 transition-all shadow-sm"
          disabled={status !== GameStatus.IDLE}
        >
          <i className="fa-solid fa-file-import"></i>
          가져오기
        </button>
        <input 
          type="file" 
          ref={jsonInputRef} 
          onChange={handleJsonChange} 
          accept=".json,application/json" 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default Controls;
