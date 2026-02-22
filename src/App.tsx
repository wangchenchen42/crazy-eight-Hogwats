/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Hand, 
  Layers, 
  ChevronRight,
  AlertCircle,
  Info
} from 'lucide-react';
import { Suit, Rank, Card, GameState, GameStatus } from './types';
import { createDeck, canPlayCard, SUITS } from './utils';

const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    playerHand: [],
    aiHand: [],
    drawPile: [],
    discardPile: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    activeSuit: null,
    isSuitPicking: false,
  });

  const [message, setMessage] = useState<string>("欢迎来到霍格沃茨！准备好你的魔杖。");

  // Initialize Game
  const startGame = useCallback(() => {
    const deck = createDeck();
    const playerHand = deck.splice(0, 8);
    const aiHand = deck.splice(0, 8);
    
    // Ensure the first discard is not an 8 for simplicity
    let firstDiscardIndex = deck.findIndex(c => c.rank !== Rank.EIGHT);
    if (firstDiscardIndex === -1) firstDiscardIndex = 0;
    const discardPile = [deck.splice(firstDiscardIndex, 1)[0]];
    
    setGameState({
      playerHand,
      aiHand,
      drawPile: deck,
      discardPile,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      activeSuit: null,
      isSuitPicking: false,
    });
    setMessage("轮到你了！施展你的咒语（出牌）。");
  }, []);

  const topCard = useMemo(() => 
    gameState.discardPile[gameState.discardPile.length - 1], 
    [gameState.discardPile]
  );

  const checkWin = useCallback((state: GameState) => {
    if (state.playerHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'gameOver', winner: 'player' }));
      return true;
    }
    if (state.aiHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'gameOver', winner: 'ai' }));
      return true;
    }
    return false;
  }, []);

  // AI Logic
  const executeAiTurn = useCallback(async () => {
    if (gameState.status !== 'playing' || gameState.currentTurn !== 'ai') return;

    // Small delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));

    setGameState(prev => {
      const playableCardIndex = prev.aiHand.findIndex(card => 
        canPlayCard(card, prev.discardPile[prev.discardPile.length - 1], prev.activeSuit)
      );

      if (playableCardIndex !== -1) {
        const card = prev.aiHand[playableCardIndex];
        const newAiHand = [...prev.aiHand];
        newAiHand.splice(playableCardIndex, 1);
        
        let newActiveSuit = null;
        if (card.rank === Rank.EIGHT) {
          // AI picks the suit it has most of
          const suitCounts: Record<string, number> = {};
          newAiHand.forEach(c => {
            suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
          });
          newActiveSuit = (Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Suit) || Suit.HEARTS;
          setMessage(`伏地魔使用了邓布利多 (🧙‍♂️) 并选择了 ${getSuitName(newActiveSuit)} 学院!`);
        } else {
          setMessage(`伏地魔施展了 ${card.rank} (${getSuitName(card.suit)})。`);
        }

        const newState = {
          ...prev,
          aiHand: newAiHand,
          discardPile: [...prev.discardPile, card],
          currentTurn: 'player' as const,
          activeSuit: newActiveSuit,
        };

        return newState;
      } else if (prev.drawPile.length > 0) {
        // AI draws
        const newDrawPile = [...prev.drawPile];
        const drawnCard = newDrawPile.pop()!;
        setMessage("AI had no moves and drew a card.");
        return {
          ...prev,
          drawPile: newDrawPile,
          aiHand: [...prev.aiHand, drawnCard],
          currentTurn: 'player' as const,
        };
      } else {
        // AI skips
        setMessage("AI had no moves and draw pile is empty. Skipping.");
        return {
          ...prev,
          currentTurn: 'player' as const,
        };
      }
    });
  }, [gameState.status, gameState.currentTurn]);

  useEffect(() => {
    if (gameState.currentTurn === 'ai' && gameState.status === 'playing') {
      executeAiTurn();
    }
  }, [gameState.currentTurn, gameState.status, executeAiTurn]);

  useEffect(() => {
    if (gameState.status === 'playing') {
      checkWin(gameState);
    }
  }, [gameState.playerHand.length, gameState.aiHand.length, gameState.status, checkWin, gameState]);

  // Player Actions
  const playCard = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;
    
    if (!canPlayCard(card, topCard, gameState.activeSuit)) {
      setMessage("You can't play that card!");
      return;
    }

    const newPlayerHand = gameState.playerHand.filter(c => c.id !== card.id);
    
    if (card.rank === Rank.EIGHT) {
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
        discardPile: [...prev.discardPile, card],
        isSuitPicking: true,
      }));
      setMessage("你召唤了邓布利多 (🧙‍♂️)！请选择一个新的学院。");
    } else {
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
        discardPile: [...prev.discardPile, card],
        currentTurn: 'ai',
        activeSuit: null,
      }));
      setMessage(`你施展了 ${card.rank} (${getSuitName(card.suit)})。`);
    }
  };

  const drawCard = () => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;
    
    // Check if player actually has no moves
    const hasMove = gameState.playerHand.some(card => canPlayCard(card, topCard, gameState.activeSuit));
    if (hasMove) {
      setMessage("你还有可以施展的咒语！");
      return;
    }

    if (gameState.drawPile.length === 0) {
      setMessage("魔力池已空！回合跳过。");
      setGameState(prev => ({ ...prev, currentTurn: 'ai' }));
      return;
    }

    const newDrawPile = [...gameState.drawPile];
    const drawnCard = newDrawPile.pop()!;
    
    setGameState(prev => ({
      ...prev,
      drawPile: newDrawPile,
      playerHand: [...prev.playerHand, drawnCard],
      currentTurn: 'ai',
    }));
    setMessage("你从魔力池抽取了一张牌。轮到伏地魔了。");
  };

  const pickSuit = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      activeSuit: suit,
      isSuitPicking: false,
      currentTurn: 'ai',
    }));
    setMessage(`你选择了 ${getSuitName(suit)} 学院。轮到伏地魔了。`);
  };

  // Rendering Helpers
  const renderCard = (card: Card, isHidden: boolean = false, onClick?: () => void, isPlayable: boolean = false) => {
    const houseColors = getHouseColors(card.suit);
    
    return (
      <motion.div
        layoutId={card.id}
        onClick={onClick}
        whileHover={onClick ? { y: -20, scale: 1.05 } : {}}
        className={`relative flex-shrink-0 cursor-pointer rounded-lg shadow-lg border-2 flex flex-col items-center justify-center
          ${isPlayable ? 'border-yellow-400 ring-4 ring-yellow-400/30' : 'border-white/10'}
          ${isHidden ? '' : 'bg-white'}
        `}
        style={{ 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT,
          backgroundColor: isHidden ? undefined : '#fdfcf0' // Parchment color
        }}
      >
        {isHidden ? (
          <div className="w-full h-full bg-[#3c0000] p-2 overflow-hidden relative">
            {/* Intricate Pattern Background */}
            <div className="absolute inset-0 opacity-20" style={{ 
              backgroundImage: `radial-gradient(circle at 2px 2px, #EEBA30 1px, transparent 0)`,
              backgroundSize: '12px 12px' 
            }} />
            
            {/* Decorative Border */}
            <div className="w-full h-full border-2 border-[#EEBA30]/30 rounded-md flex items-center justify-center relative z-10">
              <div className="absolute inset-1 border border-[#EEBA30]/10 rounded-sm" />
              
              {/* Central Logo/Icon */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#EEBA30]/10 flex items-center justify-center backdrop-blur-sm border border-[#EEBA30]/20">
                  <Layers className="text-[#EEBA30]" size={20} />
                </div>
                <div className="text-[8px] font-black tracking-[0.2em] uppercase text-[#EEBA30]/40">
                  HOGWARTS
                </div>
              </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-3 left-3 w-1.5 h-1.5 border-t border-l border-[#EEBA30]/40" />
            <div className="absolute top-3 right-3 w-1.5 h-1.5 border-t border-r border-[#EEBA30]/40" />
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 border-b border-l border-[#EEBA30]/40" />
            <div className="absolute bottom-3 right-3 w-1.5 h-1.5 border-b border-r border-[#EEBA30]/40" />
          </div>
        ) : (
          <>
            <div className={`absolute top-1.5 left-1.5 text-sm font-bold leading-tight`} style={{ color: houseColors.primary }}>
              {card.rank}
            </div>
            <div className={`text-4xl`} style={{ color: houseColors.primary }}>
              {getSuitIcon(card.suit)}
            </div>
            <div className={`absolute bottom-1.5 right-1.5 text-sm font-bold leading-tight rotate-180`} style={{ color: houseColors.primary }}>
              {card.rank}
            </div>
          </>
        )}
      </motion.div>
    );
  };

  const getSuitIcon = (suit: Suit) => {
    switch (suit) {
      case Suit.HEARTS: return '🦁'; // Gryffindor
      case Suit.DIAMONDS: return '🦡'; // Hufflepuff
      case Suit.CLUBS: return '🦅'; // Ravenclaw
      case Suit.SPADES: return '🐍'; // Slytherin
    }
  };

  const getSuitName = (suit: Suit) => {
    switch (suit) {
      case Suit.HEARTS: return '格兰芬多';
      case Suit.DIAMONDS: return '赫奇帕奇';
      case Suit.CLUBS: return '拉文克劳';
      case Suit.SPADES: return '斯莱特林';
    }
  };

  const getHouseColors = (suit: Suit) => {
    switch (suit) {
      case Suit.HEARTS: return { primary: '#740001', secondary: '#EEBA30' };
      case Suit.DIAMONDS: return { primary: '#FFDB00', secondary: '#000000' };
      case Suit.CLUBS: return { primary: '#0E1A40', secondary: '#946B2D' };
      case Suit.SPADES: return { primary: '#1A472A', secondary: '#AAAAAA' };
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0f0f] text-[#EEBA30] font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 bg-black/40 flex justify-between items-center backdrop-blur-sm border-b border-[#EEBA30]/20">
        <div className="flex items-center gap-2">
          <Layers className="text-[#EEBA30]" />
          <h1 className="text-2xl font-bold tracking-tight uppercase">霍格沃茨之疯狂八点</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-black/30 px-3 py-1 rounded-full text-sm font-mono flex items-center gap-2 border border-[#EEBA30]/10">
            <span className="opacity-50">魔力池:</span> {gameState.drawPile.length}
          </div>
          <button 
            onClick={startGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="重新开始"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-between p-4 md:p-8">
        
        {/* AI Hand */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-50">
            <AlertCircle size={12} /> 伏地魔 ({gameState.aiHand.length} 张咒语)
          </div>
          <div className="flex justify-center -space-x-12 md:-space-x-16 h-36">
            <AnimatePresence>
              {gameState.aiHand.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {renderCard(card, true)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Table */}
        <div className="flex items-center gap-8 md:gap-16 my-8">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] uppercase tracking-tighter opacity-40">魔力池</div>
            <div 
              onClick={drawCard}
              className={`relative cursor-pointer group ${gameState.currentTurn !== 'player' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Stack effect */}
              <div className="absolute inset-0 bg-[#2a0000] rounded-lg translate-x-1.5 translate-y-1.5 shadow-lg" />
              <div className="absolute inset-0 bg-[#3a0000] rounded-lg translate-x-0.75 translate-y-0.75 shadow-md" />
              
              <div className="w-[100px] h-[140px] bg-[#4a0000] rounded-lg border-2 border-[#EEBA30]/20 overflow-hidden relative shadow-xl group-hover:translate-y-[-4px] transition-transform">
                {/* Pattern */}
                <div className="absolute inset-0 opacity-20" style={{ 
                  backgroundImage: `radial-gradient(circle at 2px 2px, #EEBA30 1px, transparent 0)`,
                  backgroundSize: '10px 10px' 
                }} />
                
                {/* Decorative Border */}
                <div className="absolute inset-2 border border-[#EEBA30]/30 rounded-md flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[#EEBA30]/10 flex items-center justify-center backdrop-blur-sm border border-[#EEBA30]/20">
                      <Layers className="text-[#EEBA30]" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] uppercase tracking-tighter opacity-40">弃牌堆</div>
            <div className="relative w-[100px] h-[140px]">
              <AnimatePresence mode="popLayout">
                {gameState.discardPile.slice(-3).map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ scale: 0.8, opacity: 0, rotate: Math.random() * 20 - 10 }}
                    animate={{ scale: 1, opacity: 1, rotate: Math.random() * 10 - 5 }}
                    className="absolute inset-0"
                    style={{ zIndex: i }}
                  >
                    {renderCard(card)}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Active Suit Indicator */}
              {gameState.activeSuit && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-4 -right-4 w-10 h-10 bg-[#EEBA30] rounded-full flex items-center justify-center text-2xl shadow-lg z-50 text-black border-2 border-white"
                >
                  {getSuitIcon(gameState.activeSuit)}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Message Banner */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full max-w-md px-4 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/80 backdrop-blur-md border border-[#EEBA30]/20 px-6 py-3 rounded-2xl text-center shadow-2xl"
            >
              <p className="text-sm md:text-base font-medium text-[#EEBA30]">{message}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Player Hand */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
            <Hand size={12} className="text-[#EEBA30]" /> 你的魔杖（手牌）
            {gameState.currentTurn === 'player' && (
              <span className="ml-2 px-2 py-0.5 bg-[#740001] text-[#EEBA30] rounded-full text-[10px] animate-pulse border border-[#EEBA30]/30">轮到你了</span>
            )}
          </div>
          <div className="w-full max-w-5xl overflow-x-auto pb-8 px-4 scrollbar-hide">
            <div className="flex justify-center -space-x-10 md:-space-x-12 min-w-max h-44 items-end">
              <AnimatePresence>
                {gameState.playerHand.map((card) => {
                  const isPlayable = canPlayCard(card, topCard, gameState.activeSuit) && gameState.currentTurn === 'player';
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                    >
                      {renderCard(
                        card, 
                        false, 
                        () => playCard(card),
                        isPlayable
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {/* Start/Waiting Screen */}
        {gameState.status === 'waiting' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1a0f0f]/95 backdrop-blur-xl flex flex-center items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center space-y-8">
              <div className="space-y-2">
                <div className="w-24 h-24 bg-[#EEBA30] rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-12">
                  <Layers size={48} className="text-[#740001]" />
                </div>
                <h2 className="text-5xl font-black tracking-tighter uppercase italic text-[#EEBA30]">霍格沃茨之疯狂八点</h2>
                <p className="text-[#EEBA30]/60">在魔法世界中展现你的智慧与勇气。</p>
              </div>
              
              <div className="bg-white/5 border border-[#EEBA30]/20 rounded-2xl p-6 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#740001]/40 rounded-lg text-[#EEBA30]"><Play size={16} /></div>
                  <div>
                    <h4 className="font-bold text-sm">如何施法</h4>
                    <p className="text-xs text-white/60 leading-relaxed">匹配弃牌堆顶部的学院（花色）或咒语（点数）。最先清空手牌者获胜！</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#EEBA30]/20 rounded-lg text-[#EEBA30]"><Info size={16} /></div>
                  <div>
                    <h4 className="font-bold text-sm">邓布利多的智慧 (8)</h4>
                    <p className="text-xs text-white/60 leading-relaxed">邓布利多 (🧙‍♂️) 是万能的！随时施展他来改变当前的学院。</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-[#EEBA30] hover:bg-[#EEBA30]/80 text-[#740001] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                开始魔法对决 <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Suit Picker Modal */}
        {gameState.isSuitPicking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-[#1a0f0f] border border-[#EEBA30]/20 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6">
              <h3 className="text-2xl font-bold text-[#EEBA30]">选择一个学院</h3>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => {
                  const colors = getHouseColors(suit);
                  return (
                    <button
                      key={suit}
                      onClick={() => pickSuit(suit)}
                      className={`p-6 rounded-2xl border-2 border-white/5 hover:border-[#EEBA30] transition-all group flex flex-col items-center gap-2 bg-white/5`}
                    >
                      <span className={`text-4xl`} style={{ color: colors.primary }}>
                        {getSuitIcon(suit)}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-100 text-[#EEBA30]">{getSuitName(suit)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 bg-[#1a0f0f]/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="text-center space-y-8 max-w-md">
              <div className="relative">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-32 h-32 bg-[#EEBA30] rounded-full mx-auto flex items-center justify-center shadow-2xl"
                >
                  <Trophy size={64} className="text-[#740001]" />
                </motion.div>
                <div className="absolute -top-4 -right-4 bg-[#740001] text-[#EEBA30] px-4 py-1 rounded-full font-black text-sm shadow-lg border border-[#EEBA30]/30">
                  对决结束
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl font-black uppercase italic text-[#EEBA30]">
                  {gameState.winner === 'player' ? '你赢了！' : '伏地魔赢了！'}
                </h2>
                <p className="text-[#EEBA30]/60">
                  {gameState.winner === 'player' 
                    ? '格兰芬多加100分！你成功击败了黑魔王。' 
                    : '黑魔法笼罩了霍格沃茨... 别放弃，再次挑战他！'}
                </p>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-[#EEBA30] text-[#740001] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-[#EEBA30]/80 flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} /> 再次对决
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-4 text-center text-[10px] uppercase tracking-[0.2em] opacity-30 text-[#EEBA30]">
        Hogwarts Magic Engine v2.0 • Magic is Everywhere
      </footer>
    </div>
  );
}
