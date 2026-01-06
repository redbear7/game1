
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

  // 랭킹 리셋 시 즉각적인 변화를 위해 텍스트 수정
  const topRankerName = leaderboard.length > 0 ? leaderboard[0].name : '준비 중';

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

  useEffect(() =>