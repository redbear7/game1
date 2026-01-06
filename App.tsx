
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCard, GameStatus, LevelData, LeaderboardEntry } from './types';
import { INITIAL_GAME_DATA, DEFAULT_BPM, MIN_BPM, MAX_BPM, DEFAULT_AUDIO_URL } from './constants';
import { generateThemedCards } from './services/geminiService';
import { saveAudioBlob, getSavedAudio, clearSavedAudio } from './services/dbService';
import RhythmBoard from './components/RhythmBoard';
import Header from './components/Header';
import Controls from './components/Controls';
import Leaderboard from './components/Leaderboard';

const STORAGE_KEY = 'rhythm_quest_save_data';
const LEADERBOARD_KEY = 'rhythm_quest_leaderboard';
const DELAYS_KEY = 'rhythm_quest_level_delays';
const API_KEY_STORAGE = 'GEMINI_USER_API_KEY';
const CYCLES_PER_LEVEL = 1; 

const App: React.FC = () => {
  const [levels, setLevels] = useState<LevelData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0].cards)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load saved data", e);
    }
    return INITIAL_GAME_DATA;
  });
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LEADERBOARD_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
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

  const [userName, setUserName] = useState('바울');
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [totalCorrectCount, setTotalCorrectCount] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(DEFAULT_AUDIO_URL);
  const [audioName, setAudioName] = useState<string | null>('기본 배경음악');
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  
  const [isAudioSynced, setIsAudioSynced] = useState(false);
  const [isStoppedManually, setIsStoppedManually] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentLevel = levels.find(l => l.id === currentLevelId) || levels[0] || INITIAL_GAME_DATA[0];
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const cycleRef = useRef(0);
  const lastHitBeatRef = useRef<number>(-1);
  const isPlayingRef = useRef(false);
  const activeLevelIdRef = useRef(currentLevelId);

  const topRankerName = leaderboard.length > 0 ? leaderboard[0].name : '바울';

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
        console.error("Failed to load local audio", e);
      }
    };
    loadSavedAudioFile();
  }, []);

  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) setHasApiKey(true);
    else setHasApiKey(!!process.env.API_KEY);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  }, [levels]);

  useEffect(() => {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem(DELAYS_KEY, JSON.stringify(levelDelays));
  }, [levelDelays]);

  useEffect(() => {
    setScore(totalCorrectCount * 5);
  }, [totalCorrectCount]);

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
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
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
    } catch (e) {
      console.warn("Audio playback issue", e);
    }
  }, []);

  const finishGame = useCallback(() => {
    isPlayingRef.current = false;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setStatus(GameStatus.FINISHED);
    setIsStoppedManually(false);
    
    const finalScore = totalCorrectCount * 5;
    const entry: LeaderboardEntry = {
      name: userName || '무명 도전자',
      score: finalScore,
      time: formatTime(elapsedTime),
      elapsedTime: elapsedTime,
      level: currentLevelId,
      date: new Date().toLocaleDateString(),
    };
    
    setLeaderboard(prev => {
      const updated = [...prev, entry].sort((a, b) => b.elapsedTime - a.elapsedTime).slice(0, 10);
      return updated;
    });

    if (bgMusicRef.current) bgMusicRef.current.pause();
  }, [totalCorrectCount, userName, elapsedTime, currentLevelId]);

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
    if (status === GameStatus.PLAYING && cycleCount >= CYCLES_PER_LEVEL) {
      nextLevel();
    }
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
      
      setCurrentBeat(prev => {
        if (prev === -1) {
          playClick(880);
          return 0;
        }
        return prev;
      });

      intervalId = setInterval(() => {
        if (!isPlayingRef.current || effectBoundLevelId !== activeLevelIdRef.current) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        setCurrentBeat(prev => {
          const next = (prev + 1) % cardCount;
          
          if (next === 0 && prev !== -1) {
            const nextCycle = cycleRef.current + 1;
            cycleRef.current = nextCycle;
            setCycleCount(nextCycle);
            if (nextCycle >= CYCLES_PER_LEVEL) {
              if (intervalId) clearInterval(intervalId);
              return prev; 
            }
          }
          
          playClick(next % 4 === 0 ? 880 : 440);
          return next;
        });
      }, beatInterval);
    };

    const currentDelaySec = levelDelays[currentLevelId - 1] || 0;
    const isFirstStartOfLevel = currentBeat === -1;
    const delay = (isAudioSynced && isFirstStartOfLevel) ? currentDelaySec * 1000 : 0;
    
    timeoutId = setTimeout(startBeat, delay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, currentLevelId, isAudioSynced, levelDelays, currentLevel.bpm, currentLevel.cards, playClick]);

  const stopGame = useCallback(() => {
    if (status === GameStatus.PLAYING || status === GameStatus.PAUSED) {
      finishGame();
    } else {
      setStatus(GameStatus.FINISHED);
      isPlayingRef.current = false;
    }
    setIsStoppedManually(true);
    setCurrentBeat(-1);
    cycleRef.current = 0;
    setCycleCount(0);
    lastHitBeatRef.current = -1;
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
  }, [status, finishGame]);

  const startTimer = useCallback(() => {
    const update = () => {
      if (!isPlayingRef.current) return;
      setElapsedTime(performance.now() - startTimeRef.current);
      timerRef.current = requestAnimationFrame(update);
    };
    timerRef.current = requestAnimationFrame(update);
  }, []);

  const resetGame = useCallback(() => {
    isPlayingRef.current = false;
    setStatus(GameStatus.IDLE);
    setIsStoppedManually(false);
    setTotalCorrectCount(0);
    setElapsedTime(0);
    setCurrentBeat(-1);
    cycleRef.current = 0;
    setCycleCount(0);
    lastHitBeatRef.current = -1;
    setCurrentLevelId(1);
    activeLevelIdRef.current = 1;
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
  }, []);

  const handleResetLeaderboard = useCallback(() => {
    if (confirm("정말로 모든 랭킹 기록을 초기화하시겠습니까?")) {
      setLeaderboard([]);
      localStorage.removeItem(LEADERBOARD_KEY);
      alert("랭킹 기록이 모두 삭제되었습니다.");
    }
  }, []);

  const startGame = useCallback(() => {
    if (!userName.trim()) {
      alert("도전자 이름을 입력해주세요!");
      return;
    }
    isPlayingRef.current = true;
    activeLevelIdRef.current = currentLevelId; 
    setStatus(GameStatus.PLAYING);
    setIsStoppedManually(false);
    setTotalCorrectCount(0);
    setCycleCount(0);
    cycleRef.current = 0;
    setCurrentBeat(-1);
    
    if (bgMusicRef.current && audioUrl) {
      bgMusicRef.current.currentTime = 0;
      bgMusicRef.current.play().catch(e => console.warn("Audio play blocked", e));
    }
    startTimeRef.current = performance.now();
    startTimer();
  }, [userName, audioUrl, startTimer, currentLevelId]);

  const handleOpenKeyConfig = () => {
    setInputApiKey(localStorage.getItem(API_KEY_STORAGE) || '');
    setIsApiKeyModalOpen(true);
  };

  const handleSaveApiKey = () => {
    const key = inputApiKey.trim();
    if (!key) {
      alert("API 키를 입력해주세요.");
      return;
    }
    localStorage.setItem(API_KEY_STORAGE, key);
    setHasApiKey(true);
    setIsApiKeyModalOpen(false);
    alert("API 키가 성공적으로 저장되었습니다.");
  };

  const handleThemeChange = async (newTheme: string) => {
    if (!hasApiKey) {
      handleOpenKeyConfig();
      return;
    }

    setLoading(true);
    try {
      const data = await generateThemedCards(newTheme);
      if (data && Array.isArray(data.levels)) {
        setLevels(prevLevels => prevLevels.map(oldLevel => {
          if (oldLevel.id % 2 === 0) {
            const aiLevel = data.levels.find((l: any) => l.id === oldLevel.id);
            if (aiLevel) {
              return { ...oldLevel, theme: aiLevel.theme, cards: aiLevel.cards };
            }
          }
          return oldLevel;
        }));
        resetGame();
      } else {
        throw new Error("Invalid AI Response Format");
      }
    } catch (error: any) {
      console.error("Theme generation error", error);
      if (error.message?.includes("API_KEY")) {
        alert("API 키를 다시 확인해주세요.");
        setHasApiKey(false);
        handleOpenKeyConfig();
      } else {
        alert("스테이지 생성에 실패했습니다: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (id: number) => {
    if (status !== GameStatus.IDLE) return;
    setCurrentLevelId(id);
    activeLevelIdRef.current = id;
    setCurrentBeat(-1);
    cycleRef.current = 0;
    setCycleCount(0);
  };

  const handleSaveAudioToDevice = async () => {
    if (!currentAudioBlob || !audioName) {
      alert("저장할 사용자 음원이 없습니다. 음원을 먼저 업로드해주세요.");
      return;
    }
    try {
      await saveAudioBlob(currentAudioBlob, audioName);
      alert(`[${audioName}] 음원이 기기에 영구 저장되었습니다.\n다음 접속 시 자동으로 로드됩니다.`);
    } catch (e) {
      alert("음원 저장 중 오류가 발생했습니다.");
    }
  };

  const handleResetAudio = async () => {
    await clearSavedAudio();
    if (audioUrl && audioUrl !== DEFAULT_AUDIO_URL) URL.revokeObjectURL(audioUrl);
    setAudioUrl(DEFAULT_AUDIO_URL);
    setAudioName('기본 배경음악');
    setCurrentAudioBlob(null);
    alert("기본 음원으로 초기화되었습니다.");
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
      {audioUrl && <audio ref={bgMusicRef} src={audioUrl} loop crossOrigin="anonymous" />}
      
      <Header 
        currentLevelId={currentLevelId}
        levels={levels.map(l => ({ id: l.id }))}
        onLevelChange={handleLevelChange}
        score={score}
        status={status}
        themeName={currentLevel.theme}
        cycleCount={cycleCount}
        maxCycles={CYCLES_PER_LEVEL}
        elapsedTimeFormatted={formatTime(elapsedTime)}
        isStopped={isStoppedManually}
        leaderboard={leaderboard}
        topRankerName={topRankerName}
      />

      <button 
        onClick={handleOpenKeyConfig}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#1a1a1a] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-stone-800 active:scale-90 transition-all z-40 border border-stone-800"
      >
        <i className="fa-solid fa-key text-xl text-red-500"></i>
      </button>
      
      <main className="w-full flex-grow flex flex-col items-center justify-center gap-12 mb-8 relative">
        {status === GameStatus.FINISHED ? (
          <Leaderboard leaderboard={leaderboard} onReset={resetGame} onResetRanking={handleResetLeaderboard} />
        ) : loading ? (
          <div className="flex flex-col items-center gap-8 py-20 animate-pulse">
            <div className="w-24 h-24 border-[12px] border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-amber-800 font-black text-3xl korean-gothic">AI 스테이지 기획 중...</p>
          </div>
        ) : (
          <RhythmBoard 
            cards={currentLevel.cards || []} 
            activeBeat={currentBeat} 
            onCardClick={(idx) => {
              if (status !== GameStatus.PLAYING) return;
              if (idx === currentBeat && lastHitBeatRef.current !== currentBeat) {
                setTotalCorrectCount(prev => prev + 1);
                lastHitBeatRef.current = currentBeat;
                playClick(1200); 
              }
            }}
            onUpdateCard={(id, word) => {
              setLevels(prev => prev.map(l => l.id === currentLevelId ? { ...l, cards: l.cards.map(c => c.id === id ? { ...c, word } : c) } : l));
            }}
            isEditingEnabled={status === GameStatus.IDLE}
            isPaused={status === GameStatus.PAUSED}
          />
        )}

        {status !== GameStatus.FINISHED && (
          <Controls 
            status={status}
            userName={userName}
            setUserName={setUserName}
            bpm={currentLevel.bpm}
            setBpm={(val) => setLevels(prev => prev.map(l => l.id === currentLevelId ? { ...l, bpm: val } : l))}
            onStart={startGame}
            onStop={stopGame}
            onPause={() => {
              isPlayingRef.current = false;
              setStatus(GameStatus.PAUSED);
              if (timerRef.current) cancelAnimationFrame(timerRef.current);
              if (bgMusicRef.current) bgMusicRef.current.pause();
            }}
            onResume={() => {
              isPlayingRef.current = true;
              setStatus(GameStatus.PLAYING);
              startTimeRef.current = performance.now() - elapsedTime;
              if (bgMusicRef.current) bgMusicRef.current.play();
              startTimer();
            }}
            onThemeChange={handleThemeChange}
            onAudioUpload={(file) => {
              if (audioUrl && audioUrl !== DEFAULT_AUDIO_URL) URL.revokeObjectURL(audioUrl);
              setAudioUrl(URL.createObjectURL(file));
              setAudioName(file.name);
              setCurrentAudioBlob(file);
            }}
            audioName={audioName}
            isAudioSynced={isAudioSynced}
            setIsAudioSynced={setIsAudioSynced}
            levelDelays={levelDelays}
            updateDelay={(idx, val) => {
              const next = [...levelDelays];
              next[idx] = val;
              setLevelDelays(next);
            }}
            onExport={() => {
              const data = JSON.stringify({ levels, levelDelays, isAudioSynced }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = "rhythm_quest_settings.json";
              link.click();
            }}
            onImport={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const json = JSON.parse(e.target?.result as string);
                  if (json.levels) setLevels(json.levels);
                  if (json.levelDelays) setLevelDelays(json.levelDelays);
                  if (typeof json.isAudioSynced === 'boolean') setIsAudioSynced(json.isAudioSynced);
                } catch (e) { alert("잘못된 파일 형식입니다."); }
              };
              reader.readAsText(file);
            }}
            onOpenKeyConfig={handleOpenKeyConfig}
            onSaveCurrent={() => {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
              localStorage.setItem(DELAYS_KEY, JSON.stringify(levelDelays));
              alert("현재 설정이 저장되었습니다.");
            }}
            onSaveAudioToDevice={handleSaveAudioToDevice}
            onResetAudio={handleResetAudio}
            onResetRanking={handleResetLeaderboard}
            hasApiKey={hasApiKey}
            loading={loading}
          />
        )}
      </main>

      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] w-full max-w-sm rounded-2xl shadow-2xl border border-stone-800 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-key text-red-600 text-xl"></i>
                  <h2 className="text-xl font-black text-white korean-gothic">API 키 설정</h2>
                </div>
                <button onClick={() => setIsApiKeyModalOpen(false)} className="text-stone-500 hover:text-white">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="space-y-4">
                <input 
                  type="password"
                  placeholder="AI Studio 키 입력"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  className="w-full bg-[#0d1117] border border-stone-800 rounded-xl px-4 py-3 text-white outline-none focus:border-red-600 font-mono text-sm"
                />
                <button 
                  onClick={handleSaveApiKey}
                  className="w-full bg-[#991b1b] hover:bg-red-800 text-white rounded-xl py-3 font-black transition-all"
                >
                  연결 테스트 및 저장
                </button>
                <p className="text-[10px] text-stone-500 leading-relaxed">* 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
              </div>
            </div>
            <div className="border-t border-stone-800 p-4">
              <button onClick={() => setIsApiKeyModalOpen(false)} className="w-full text-stone-400 font-bold text-sm py-2">닫기</button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full flex justify-between items-center text-stone-400 text-xs font-black px-4 py-6 border-t border-stone-200">
        <div className="flex gap-4">
          <span><i className="fa-solid fa-stopwatch mr-1"></i>정밀 타이머 가동</span>
          <span><i className="fa-solid fa-music mr-1"></i>BPM: {currentLevel.bpm}</span>
        </div>
        <p className="tracking-[0.3em] uppercase">RHYTHM WORD QUEST V6.5.0</p>
      </footer>
    </div>
  );
};

export default App;
