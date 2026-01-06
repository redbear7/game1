
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCard, GameStatus, LevelData } from './types';
import { INITIAL_GAME_DATA, DEFAULT_BPM, MIN_BPM, MAX_BPM, DEFAULT_AUDIO_URL } from './constants';
import { generateThemedCards } from './services/geminiService';
import { saveAudioBlob, getSavedAudio, clearSavedAudio } from './services/dbService';
import RhythmBoard from './components/RhythmBoard';
import Header from './components/Header';
import Controls from './components/Controls';

const STORAGE_KEY = 'rhythm_quest_v6_data';
const DELAYS_KEY = 'rhythm_quest_v6_delays';
const CYCLES_PER_LEVEL = 1; 

const App: React.FC = () => {
  // 상태 관리: 로컬 스토리지에서 저장된 데이터 로드 (현재 값을 디폴트로 유지)
  const [levels, setLevels] = useState<LevelData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_GAME_DATA;
  });
  
  const [levelDelays, setLevelDelays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(DELAYS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 9) return parsed;
      }
    } catch (e) { }
    return new Array(9).fill(3);
  });

  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  
  // 음원 관리: 초기 로딩 시 IndexedDB 확인
  const [audioUrl, setAudioUrl] = useState<string | null>(DEFAULT_AUDIO_URL);
  const [audioName, setAudioName] = useState<string | null>('기본 배경음악');
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  
  const [isAudioSynced, setIsAudioSynced] = useState(false);
  const [isStoppedManually, setIsStoppedManually] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const cycleRef = useRef(0);
  const lastHitBeatRef = useRef<number>(-1);
  const isPlayingRef = useRef(false);
  const activeLevelIdRef = useRef(currentLevelId);

  const currentLevel = levels.find(l => l.id === currentLevelId) || levels[0];

  // 음원 파일 자동 로딩 및 내장
  useEffect(() => {
    const loadSavedAudioFile = async () => {
      try {
        const saved = await getSavedAudio();
        if (saved) {
          const url = URL.createObjectURL(saved.blob);
          setAudioUrl(url);
          setAudioName(saved.name);
          setCurrentAudioBlob(saved.blob);
        }
      } catch (e) {
        console.error("Audio Load Error", e);
      }
    };
    loadSavedAudioFile();
  }, []);

  // 데이터 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  }, [levels]);

  useEffect(() => {
    localStorage.setItem(DELAYS_KEY, JSON.stringify(levelDelays));
  }, [levelDelays]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const playClick = useCallback((freq = 440) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) {}
  }, []);

  const finishGame = useCallback(() => {
    isPlayingRef.current = false;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setStatus(GameStatus.FINISHED);
    if (bgMusicRef.current) bgMusicRef.current.pause();
  }, []);

  const nextLevel = useCallback(() => {
    if (currentLevelId < levels.length) {
      const nextId = currentLevelId + 1;
      activeLevelIdRef.current = nextId;
      setCurrentLevelId(nextId);
      setCurrentBeat(-1);
      cycleRef.current = 0;
      setCycleCount(0);
      lastHitBeatRef.current = -1;
      playClick(1000); 
    } else {
      finishGame();
    }
  }, [currentLevelId, levels.length, finishGame, playClick]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && cycleCount >= CYCLES_PER_LEVEL) nextLevel();
  }, [cycleCount, status, nextLevel]);

  useEffect(() => {
    if (status !== GameStatus.PLAYING || !isPlayingRef.current) {
      setCurrentBeat(-1);
      return;
    }

    let intervalId: any = null;
    let timeoutId: any = null;
    const effectBoundLevelId = currentLevelId;

    const startBeat = () => {
      if (!isPlayingRef.current || effectBoundLevelId !== activeLevelIdRef.current) return;
      const beatInterval = (60 / currentLevel.bpm) * 1000;
      const cardCount = currentLevel.cards?.length || 8;
      
      setCurrentBeat(0);
      playClick(880);

      intervalId = setInterval(() => {
        if (!isPlayingRef.current || effectBoundLevelId !== activeLevelIdRef.current) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        setCurrentBeat(prev => {
          const next = (prev + 1) % cardCount;
          if (next === 0) {
            const nextCycle = cycleRef.current + 1;
            cycleRef.current = nextCycle;
            setCycleCount(nextCycle);
            if (nextCycle >= CYCLES_PER_LEVEL) {
              clearInterval(intervalId);
              return prev; 
            }
          }
          playClick(next % 4 === 0 ? 880 : 440);
          return next;
        });
      }, beatInterval);
    };

    const delay = (isAudioSynced && currentBeat === -1) ? (levelDelays[currentLevelId - 1] || 0) * 1000 : 0;
    timeoutId = setTimeout(startBeat, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, currentLevelId, isAudioSynced, levelDelays, currentLevel.bpm, currentLevel.cards, playClick]);

  const startGame = useCallback(() => {
    isPlayingRef.current = true;
    activeLevelIdRef.current = currentLevelId; 
    setStatus(GameStatus.PLAYING);
    setIsStoppedManually(false);
    setCycleCount(0);
    cycleRef.current = 0;
    setCurrentBeat(-1);
    
    if (bgMusicRef.current && audioUrl) {
      bgMusicRef.current.currentTime = 0;
      bgMusicRef.current.play().catch(() => {});
    }
    startTimeRef.current = performance.now();
    const update = () => {
      if (!isPlayingRef.current) return;
      setElapsedTime(performance.now() - startTimeRef.current);
      timerRef.current = requestAnimationFrame(update);
    };
    timerRef.current = requestAnimationFrame(update);
  }, [audioUrl, currentLevelId]);

  const stopGame = useCallback(() => {
    finishGame();
    setIsStoppedManually(true);
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
  }, [finishGame]);

  const handleThemeChange = async (newTheme: string) => {
    setLoading(true);
    try {
      const data = await generateThemedCards(newTheme);
      if (data && Array.isArray(data.levels)) {
        // AI 생성 로직: 홀수 레벨은 "할렐루야", 짝수 레벨만 유저 테마 적용
        const processedLevels = data.levels.map((l: any, idx: number) => {
          const levelId = idx + 1;
          const isOdd = levelId % 2 !== 0;
          if (isOdd) {
            return {
              id: levelId,
              theme: '할렐루야',
              bpm: l.bpm || DEFAULT_BPM,
              cards: ['할', '렐', '루', '야', '할', '렐', '루', '야'].map((word, i) => ({
                id: `hallelujah-${levelId}-${i}`,
                word,
                description: 'PRAISE'
              }))
            };
          }
          return {
            ...l,
            id: levelId,
            bpm: l.bpm || DEFAULT_BPM,
            cards: l.cards.slice(0, 8).map((c: any) => ({ ...c, word: c.word.substring(0, 2) }))
          };
        });
        setLevels(processedLevels);
        setStatus(GameStatus.IDLE);
        setElapsedTime(0);
        setCurrentLevelId(1);
      }
    } catch (error) {
      alert("AI 스테이지 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // 음원 경로값(audioUrl)과 이름(audioName)을 포함하여 내보내기
    const data = JSON.stringify({ 
      levels, 
      levelDelays, 
      isAudioSynced, 
      audioName, 
      audioUrl 
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rhythm_quest_${new Date().getTime()}.json`;
    link.click();
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.levels) setLevels(json.levels);
        if (json.levelDelays) setLevelDelays(json.levelDelays);
        if (typeof json.isAudioSynced === 'boolean') setIsAudioSynced(json.isAudioSynced);
        
        // 음원 정보가 있으면 자동 등록
        if (json.audioUrl && json.audioUrl.startsWith('http')) {
          setAudioUrl(json.audioUrl);
          setAudioName(json.audioName || '불러온 음원');
        }
        alert("데이터를 성공적으로 불러왔습니다.");
      } catch (e) { alert("파일 형식이 잘못되었습니다."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
      {audioUrl && <audio ref={bgMusicRef} src={audioUrl} loop crossOrigin="anonymous" />}
      
      <Header 
        currentLevelId={currentLevelId}
        levels={levels.map(l => ({ id: l.id }))}
        onLevelChange={(id) => status === GameStatus.IDLE && setCurrentLevelId(id)}
        status={status}
        themeName={currentLevel.theme}
        cycleCount={cycleCount}
        maxCycles={CYCLES_PER_LEVEL}
        elapsedTimeFormatted={formatTime(elapsedTime)}
        isStopped={isStoppedManually}
      />
      
      <main className="w-full flex-grow flex flex-col items-center justify-center gap-12 mb-8 relative">
        {status === GameStatus.FINISHED ? (
          <div className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-stone-900 text-amber-500 rounded-full flex items-center justify-center text-4xl">
               <i className="fa-solid fa-flag-checkered"></i>
             </div>
             <div className="text-center">
               <h2 className="text-4xl font-black text-stone-800 korean-gothic">도전 완료!</h2>
               <p className="text-stone-400 font-bold mt-2">최종 기록: <span className="text-stone-800 font-mono">{formatTime(elapsedTime)}</span></p>
             </div>
             <button onClick={() => setStatus(GameStatus.IDLE)} className="w-full py-5 bg-stone-800 text-white rounded-2xl font-black text-xl hover:bg-stone-700">처음으로</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-8 py-20 animate-pulse">
            <div className="w-24 h-24 border-[12px] border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-amber-800 font-black text-3xl korean-gothic">AI 스테이지 최적화 중...</p>
          </div>
        ) : (
          <RhythmBoard 
            cards={currentLevel.cards} 
            activeBeat={currentBeat} 
            onCardClick={(idx) => {
              if (status === GameStatus.PLAYING && idx === currentBeat && lastHitBeatRef.current !== currentBeat) {
                lastHitBeatRef.current = currentBeat;
                playClick(1200);
              }
            }}
            onUpdateCard={(id, word) => setLevels(prev => prev.map(l => l.id === currentLevelId ? { ...l, cards: l.cards.map(c => c.id === id ? { ...c, word } : c) } : l))}
            isEditingEnabled={status === GameStatus.IDLE}
            isPaused={status === GameStatus.PAUSED}
          />
        )}

        {status !== GameStatus.FINISHED && (
          <Controls 
            status={status}
            bpm={currentLevel.bpm}
            setBpm={(val) => setLevels(prev => prev.map(l => l.id === currentLevelId ? { ...l, bpm: val } : l))}
            onStart={startGame}
            onStop={stopGame}
            onPause={() => { isPlayingRef.current = false; setStatus(GameStatus.PAUSED); bgMusicRef.current?.pause(); }}
            onResume={() => { isPlayingRef.current = true; setStatus(GameStatus.PLAYING); bgMusicRef.current?.play(); startTimeRef.current = performance.now() - elapsedTime; }}
            onThemeChange={handleThemeChange}
            onAudioUpload={async (file) => {
              const url = URL.createObjectURL(file);
              setAudioUrl(url);
              setAudioName(file.name);
              setCurrentAudioBlob(file);
              await saveAudioBlob(file, file.name);
            }}
            audioName={audioName}
            isAudioSynced={isAudioSynced}
            setIsAudioSynced={setIsAudioSynced}
            levelDelays={levelDelays}
            updateDelay={(idx, val) => setLevelDelays(prev => { const next = [...prev]; next[idx] = val; return next; })}
            onExport={handleExport}
            onImport={handleImport}
            onSaveCurrent={() => alert("현재 설정이 브라우저에 저장되었습니다.")}
            onSaveAudioToDevice={() => alert("음원이 저장되었습니다.")}
            onResetAudio={async () => { await clearSavedAudio(); setAudioUrl(DEFAULT_AUDIO_URL); setAudioName('기본 배경음악'); }}
            loading={loading}
          />
        )}
      </main>

      <footer className="w-full flex justify-between items-center text-stone-400 text-xs font-black px-4 py-6 border-t border-stone-200">
        <div className="flex gap-4">
          <span><i className="fa-solid fa-stopwatch mr-1"></i>PRECISION TIMER</span>
          <span><i className="fa-solid fa-music mr-1"></i>BPM: {currentLevel.bpm}</span>
        </div>
        <p className="tracking-[0.3em] uppercase">RHYTHM WORD QUEST V6.8.0</p>
      </footer>
    </div>
  );
};

export default App;
