// Game states
export const STATE_NEWHAND = 0;
export const STATE_PLAYERTURN = 1;
export const STATE_DEALERTURN = 2;
export const STATE_REWARD = 3;
export const STATE_BETTING = 4;
export const STATE_SPLIT = 5;
export const STATE_INSURANCE = 6;

// Card sprite sheet settings
export const CARD_WIDTH = 11;           // Width of each card in the sprite sheet
export const CARD_HEIGHT = 9;           // Height of each card in the sprite sheet
export const CARD_GAP = 1;              // Gap between cards in the sprite sheet
export const SPRITE_COLUMNS = 13;       // Number of columns in the sprite sheet

// Mapping card codes to their positions in the sprite sheet
export const CARD_POSITIONS = {
  'AC': 0, '2C': 1, '3C': 2, '4C': 3, '5C': 4, '6C': 5, '7C': 6, '8C': 7, '9C': 8, '0C': 9, 'JC': 10, 'QC': 11, 'KC': 12,
  'AS': 13, '2S': 14, '3S': 15, '4S': 16, '5S': 17, '6S': 18, '7S': 19, '8S': 20, '9S': 21, '0S': 22, 'JS': 23, 'QS': 24, 'KS': 25,
  'AH': 26, '2H': 27, '3H': 28, '4H': 29, '5H': 30, '6H': 31, '7H': 32, '8H': 33, '9H': 34, '0H': 35, 'JH': 36, 'QH': 37, 'KH': 38,
  'AD': 39, '2D': 40, '3D': 41, '4D': 42, '5D': 43, '6D': 44, '7D': 45, '8D': 46, '9D': 47, '0D': 48, 'JD': 49, 'QD': 50, 'KD': 51,
  'BACK': 52
};

// Game settings and states
export const BET_AMOUNTS = {1: 1, 2: 2, 3: 5, 4: 10, 5: 25, 6: 50, 7: 100}; 
export const cardScale = 10;              // Scale of the cards
export let gameState = STATE_BETTING;   // Current state of the game
export let deckId = "";                 // ID of the current deck
export const deck_count = 6;            // Number of decks used
export let dealerHasPlayed = false;     // Flag to check if dealer has played
export let cardsLeft = deck_count * 52; // Number of cards left in the deck
export let playerBet = 1;              // Player's current bet
export let totalHandBet = 0;            // Total bet across all hands
export let playerMoney = 1000;          // Player's total money
export let insuranceBet = 0;            // Insurance bet
export let splitHands = [];             // Array to hold split hands
export let currentHandIndex = 0;        // Index of the current hand being played

// Player and Dealer objects to hold their respective hands and totals
export let player = { hand: [], total: 0, aceIs11: 0 }; // Player object
export let dealer = { hand: [], total: 0, aceIs11: 0 }; // Dealer object

// Setter functions for reassigning values 
// (can't set global variables without setter functions)
export function setGameState(value) {gameState = value;}
export function setDeckId(value) {deckId = value;}
export function setDealerHasPlayed(value) {dealerHasPlayed = value;}
export function setCardsLeft(value) {cardsLeft = value;}
export function setPlayerBet(value) {playerBet = value;}
export function setTotalHandBet(value) {totalHandBet = value;}
export function setPlayerMoney(value) {playerMoney = value;}
export function setInsuranceBet(value) {insuranceBet = value;}
export function setSplitHands(value) {splitHands = value};
export function setCurrentHandIndex(value) {currentHandIndex = value;}