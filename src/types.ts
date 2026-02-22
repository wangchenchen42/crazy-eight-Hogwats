export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum Rank {
  TWO = '2 🦉',
  THREE = '3 🐀',
  FOUR = '4 🐸',
  FIVE = '5 🕷️',
  SIX = '6 🦄',
  SEVEN = '7 🐉',
  EIGHT = '8 🧙‍♂️',
  NINE = '9 🧹',
  TEN = '10 📜',
  JACK = 'J 🦁',
  QUEEN = 'Q 📚',
  KING = 'K 🐍',
  ACE = 'A ⚡',
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'waiting' | 'playing' | 'gameOver';

export interface GameState {
  playerHand: Card[];
  aiHand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  currentTurn: 'player' | 'ai';
  status: GameStatus;
  winner: 'player' | 'ai' | null;
  activeSuit: Suit | null; // For when an 8 is played
  isSuitPicking: boolean;
  mana: number; // 0 to 100
  lastPlayer: 'player' | 'ai' | null;
}
