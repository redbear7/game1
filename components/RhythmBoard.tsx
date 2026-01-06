
import React, { useState, useEffect } from 'react';
import { GameCard } from '../types';

interface RhythmBoardProps {
  cards: GameCard[];
  activeBeat: number;
  onCardClick: (index: number) => void;
  onUpdateCard?: (cardId: string, newWord: string) => void;
  isEditingEnabled?: boolean;
  isPaused?: boolean;
}

const RhythmBoard: React.FC<RhythmBoardProps> = ({ 
  cards, 
  activeBeat, 
  onCardClick, 
  onUpdateCard,
  isEditingEnabled,
  isPaused
}) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [successEffect, setSuccessEffect] = useState<number | null>(null);

  useEffect(() => {
    setEditingCardId(null);
  }, [cards]);

  const handleCardClick = (index: number) => {
    if (isPaused || editingCardId) return;
    
    // 박자가 정확할 때만 효과 표시
    if (index === activeBeat) {
      setSuccessEffect(index);
      setTimeout(() => setSuccessEffect(null), 200);
    }
    
    onCardClick(index);
  };

  const startEditing = (e: React.MouseEvent, card: GameCard) => {
    e.stopPropagation();
    if (!isEditingEnabled) return;
    setEditingCardId(card.id);
    setEditValue(card.word);
  };

  const saveEdit = () => {
    if (editingCardId && onUpdateCard) {
      onUpdateCard(editingCardId, editValue);
    }
    setEditingCardId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditingCardId(null);
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center text-stone-400 bg-white/40 rounded-[3rem] border-4 border-dashed border-stone-200">
        <i className="fa-solid fa-ghost text-6xl mb-4 opacity-20"></i>
        <p className="font-black text-xl korean-gothic">표시할 카드가 없습니다</p>
        <p className="font-bold text-sm">AI 생성을 다시 시도하거나 데이터를 가져오세요</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 w-full h-auto min-h-[50vh] transition-opacity duration-300 ${isPaused ? 'opacity-50' : 'opacity-100'}`}>
      {cards.map((card, index) => {
        const isActive = activeBeat === index;
        const isSuccess = successEffect === index;
        
        return (
          <div 
            key={card.id || index}
            onClick={() => handleCardClick(index)}
            className={`
              relative cursor-pointer transition-all duration-150 transform
              bg-white rounded-[2.5rem] shadow-lg border-8 flex flex-col items-center justify-center
              active:scale-90 select-none overflow-hidden group min-h-[160px]
              ${isActive 
                ? 'active-beat border-amber-400 z-10 scale-105 shadow-amber-500/40' 
                : 'border-white opacity-95 hover:border-stone-100'}
              ${isSuccess ? 'bg-amber-400 ring-8 ring-amber-300 animate-ping' : ''}
              ${isPaused ? 'cursor-not-allowed pointer-events-none' : ''}
            `}
          >
            {isEditingEnabled && editingCardId !== card.id && (
              <button 
                onClick={(e) => startEditing(e, card)}
                className="absolute top-4 left-4 w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 hover:text-amber-500 hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-all z-20"
              >
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
            )}

            <div className={`text-center p-2 w-full flex flex-col items-center justify-center transition-transform ${isSuccess ? 'scale-125' : ''}`}>
              {editingCardId === card.id ? (
                <div className="flex flex-col items-center gap-4">
                  <input
                    autoFocus
                    type="text"
                    maxLength={2}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    className="korean-gothic text-center text-6xl sm:text-7xl md:text-8xl text-amber-500 bg-amber-50 rounded-3xl w-full max-w-[180px] outline-none border-b-4 border-amber-300"
                  />
                  <p className="text-[10px] text-amber-400 font-black uppercase">엔터키로 저장</p>
                </div>
              ) : (
                <>
                  <h3 className={`
                    korean-gothic tracking-tighter leading-tight transition-all
                    text-6xl sm:text-7xl md:text-8xl break-all
                    ${isActive ? 'text-amber-500' : 'text-stone-800'}
                    ${isSuccess ? 'text-white' : ''}
                  `}>
                    {card.word || '?'}
                  </h3>
                  {card.description && (
                    <p className={`text-sm font-bold mt-2 uppercase truncate w-full px-4 ${isSuccess ? 'text-amber-100' : 'text-stone-400 opacity-60'}`}>
                      {card.description}
                    </p>
                  )}
                </>
              )}
            </div>
            
            {!isPaused && isActive && (
              <div className="absolute inset-0 bg-amber-50/20 animate-pulse pointer-events-none"></div>
            )}
            {isSuccess && (
              <div className="absolute inset-0 bg-amber-500 flex items-center justify-center z-30">
                <span className="text-white font-black text-4xl animate-bounce">+5</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RhythmBoard;
