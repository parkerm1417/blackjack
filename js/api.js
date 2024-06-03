import { deckId, setDeckId, deck_count, setCardsLeft } from './globals.js';
import { logic } from './logic.js';
import { updateBetDisplay, updateScores } from './ui.js';
import { updateTotal } from './utils.js';

export async function init() {
  try {
    const data = await $.getJSON(`http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${deck_count}`);
      setDeckId(data.deck_id);
      updateBetDisplay();
      logic();
  } catch (error) {
    console.error("Error initializing deck:", error);
  }
}

export async function shuffle() {
  try {
    const data = await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
    if (!data.shuffled) {
      shuffle();
    }
  } catch (error) {
    console.error("Error shuffling deck:", error);
  }
}

export async function drawCard(person) {
  try {
    const data = await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
    const card = data.cards[0];
    person.hand.push(card.code);
    updateTotal(person, card.value);
    setCardsLeft(data.remaining);
    updateScores();
  } catch (error) {
    console.error("Error drawing card:", error);
  }
}