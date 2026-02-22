import { Suit, Rank, Card } from './types';

export const SUITS = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
export const RANKS = [
  Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE,
  Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
  Rank.JACK, Rank.QUEEN, Rank.KING
];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function canPlayCard(card: Card, topCard: Card, activeSuit: Suit | null): boolean {
  // An 8 is always playable
  if (card.rank === Rank.EIGHT) return true;

  // If an 8 was played, the activeSuit is the requirement
  if (activeSuit) {
    return card.suit === activeSuit;
  }

  // Otherwise, match suit or rank
  return card.suit === topCard.suit || card.rank === topCard.rank;
}
