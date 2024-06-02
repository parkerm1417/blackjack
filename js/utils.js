import { CARD_POSITIONS, CARD_WIDTH, CARD_HEIGHT, CARD_GAP, SPRITE_COLUMNS, cardScale} from './globals.js';

export async function updateTotal(person, cardValue) {
  if (['KING', 'QUEEN', 'JACK'].includes(cardValue)) {
    person.total += 10;
  } else if (cardValue === 'ACE') {
    person.total += 11;
    person.aceIs11 += 1;
  } else {
    person.total += parseInt(cardValue);
  }

  if (person.total > 21 && person.aceIs11 > 0) {
    person.total -= 10;
    person.aceIs11 -= 1;
  }
}

export function getCardBackgroundPosition(cardCode) {
  let position = CARD_POSITIONS[cardCode];
  let row = Math.floor(position / SPRITE_COLUMNS);
  let col = position % SPRITE_COLUMNS;
  let x = col * (CARD_WIDTH + CARD_GAP) * cardScale;
  let y = row * (CARD_HEIGHT + CARD_GAP) * cardScale;
  return `-${x}px -${y}px`;
}
