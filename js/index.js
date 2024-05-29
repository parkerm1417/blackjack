// GLOBAL VARIABLES
const STATE_NEWHAND = 0;
const STATE_PLAYERTURN = 1;
const STATE_DEALERTURN = 2;
const STATE_REWARD = 3;
const STATE_BETTING = 4;
const CARD_WIDTH = 11; // Width of each card in the sprite sheet
const CARD_HEIGHT = 9; // Height of each card in the sprite sheet
const CARD_GAP = 1;
const SPRITE_COLUMNS = 13; // Number of columns in the sprite sheet

// Mapping card codes to their positions in the sprite sheet
const CARD_POSITIONS = {
  'AC': 0, '2C': 1, '3C': 2, '4C': 3, '5C': 4, '6C': 5, '7C': 6, '8C': 7, '9C': 8, '0C': 9, 'JC': 10, 'QC': 11, 'KC': 12,
  'AS': 13, '2S': 14, '3S': 15, '4S': 16, '5S': 17, '6S': 18, '7S': 19, '8S': 20, '9S': 21, '0S': 22, 'JS': 23, 'QS': 24, 'KS': 25,
  'AH': 26, '2H': 27, '3H': 28, '4H': 29, '5H': 30, '6H': 31, '7H': 32, '8H': 33, '9H': 34, '0H': 35, 'JH': 36, 'QH': 37, 'KH': 38,
  'AD': 39, '2D': 40, '3D': 41, '4D': 42, '5D': 43, '6D': 44, '7D': 45, '8D': 46, '9D': 47, '0D': 48, 'JD': 49, 'QD': 50, 'KD': 51,
  'BACK': 52
};

let cardScale = 10;
let gameState = STATE_BETTING;
let deckId = "";
let deck_count = 6;
let dealerHasPlayed = false;
let cardsLeft = deck_count * 52; // 52 cards per deck
let playerBet = 10;   // Player's current bet
let playerMoney = 1000; // Player's total money

// Player and Dealer objects to hold their respective hands and totals
let player = { hand: [], total: 0, aceIs11: false };
let dealer = { hand: [], total: 0, aceIs11: false };

// FUNCTIONS

// Initialize the game by shuffling a new deck and logging the deck ID
async function init() {
  try {
    const data = await $.getJSON(`http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${deck_count}`);
    deckId = data.deck_id;
    console.log(deckId);
    updateBetDisplay();
    logic();
  } catch (error) {
    console.error("Error initializing deck:", error);
  }
}

// Shuffle the deck
async function shuffle() {
  try {
    const data = await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
    if (!data.shuffled) {
      await shuffle();
    }
  } catch (error) {
    console.error("Error shuffling deck:", error);
  }
}

// Draw a card from the deck for a given person (player or dealer)
async function drawCard(person) {
  try {
    const data = await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
    const card = data.cards[0];
    person.hand.push(card.code);
    updateTotal(person, card.value);
    cardsLeft = data.remaining;
    updateScores();
  } catch (error) {
    console.error("Error drawing card:", error);
  }
}

// Update the total score for the person based on the drawn card's value
function updateTotal(person, cardValue) {
  // Handle logic for face cards (King, Queen, Jack)
  if (['KING', 'QUEEN', 'JACK'].includes(cardValue)) {
    person.total += 10;
  
  // Handle logic for aces
  } else if (cardValue === 'ACE') {
    person.total += person.total <= 10 ? 11 : 1;
    person.aceIs11 = person.total <= 10;

  // Handle logic for number cards (2-10)
  } else {
    person.total += parseInt(cardValue);
  }

  // Adjust ace value if needed
  if (person.total > 21 && person.aceIs11) {
    person.total -= 10;
    person.aceIs11 = false;
  }
}

function getCardBackgroundPosition(cardCode) {
  let position = CARD_POSITIONS[cardCode];
  let row = Math.floor(position / SPRITE_COLUMNS);
  let col = position % SPRITE_COLUMNS;
  let x = col * (CARD_WIDTH + CARD_GAP) * cardScale;
  let y = row * (CARD_HEIGHT + CARD_GAP) * cardScale;
  return `-${x}px -${y}px`;
}

// Display the starting hands of the player and dealer
function displayStartingHands() {
  $('#dealerHand').empty();
  $('#playerHand').empty();

  player.hand.forEach(card => {
    let backgroundPosition = getCardBackgroundPosition(card);
    let $card = $('<div class="playingCard"></div>').css('background-position', backgroundPosition);
    $('#playerHand').append($card);
  });

  let dealerBackgroundPosition = getCardBackgroundPosition(dealer.hand[0]);
  $('#dealerHand').append(`<div class="playingCard" style="background-position: ${dealerBackgroundPosition};"></div>`);
  $('#dealerHand').append('<div class="card-back"></div>');
}

// Display all dealer's cards
function displayDealerCards() {
  $('.card-back').remove();
  dealer.hand.forEach((card, index) => {
    if (index > 0) {
      let backgroundPosition = getCardBackgroundPosition(card);
      $('#dealerHand').append(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
    }
  });
}

async function displayNewDealerCard() {
  let card = dealer.hand[dealer.hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  $('#dealerHand').append($card);
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function displayNewPlayerCard() {
  let card = player.hand[player.hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  $('#playerHand').append($card);
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Main game logic controller
function logic() {
  switch (gameState) {
    case STATE_BETTING:
      logicBetting();
      break;
    case STATE_NEWHAND:
      logicNewHand();
      break;
    case STATE_PLAYERTURN:
      logicPlayerTurn();
      break;
    case STATE_DEALERTURN:
      logicDealerTurn();
      dealerHasPlayed = true;
      break;
    case STATE_REWARD:
      logicReward();
      break;
  }
}

// Betting logic
function logicBetting() {
  $("#playerButtons").empty();
  $("#playerButtons").append(`
    <div id="betting-buttons">
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="bet_increase">Bet+</button>
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="bet_decrease">Bet-</button>
    </div>
  `);

  $('#bet_increase').on('click', function () {
    if (playerMoney > playerBet) {
      playerBet += 10;
      updateBetDisplay();
    }
  });

  $('#bet_decrease').on('click', function () {
    if (playerBet > 0) {
      playerBet -= 10;
      updateBetDisplay();
    }
  });

  $("#playerButtons").append(`
    <div>
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="deal">Deal</button>
    </div>
  `);

  $('#deal').on('click', function () {
    if (playerBet > 0) {
      gameState = STATE_NEWHAND;
      playerMoney -= playerBet;
      updateBetDisplay();
      logic();
    } else {
      alert("Please place a bet to start the game.");
    }
  });
}

// Start a new hand
async function logicNewHand() {
  if (cardsLeft <= 60) {
    await shuffle(deckId);
  }
  player.hand = [];
  player.total = 0;
  player.aceIs11 = false;
  dealer.hand = [];
  dealer.total = 0;
  dealer.aceIs11 = false;

  await drawCard(player);
  await drawCard(player);
  await drawCard(dealer);
  await drawCard(dealer);

  displayStartingHands();
  updateScores();

  if (player.total === 21 || (dealerHasPlayed && dealer.total === 21)) {
    gameState = STATE_REWARD;
  } else {
    gameState = STATE_PLAYERTURN;
  }
  logic();
}

// Handle player's turn
function logicPlayerTurn() {
  $("#playerButtons").empty();
  $("#playerButtons").append(`
    <div id="playerTurn-buttons">
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="hit">Hit</button>
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="stand">Stand</button>
    </div>
  `);

  $('#hit').on('click', async function () {
    await drawCard(player);
    await displayNewPlayerCard();
    if (player.total > 21) {
      gameState = STATE_REWARD;
      logic();
    }
  });

  $('#stand').on('click', function () {
    gameState = STATE_DEALERTURN;
    logic();
  });
}

// Handle dealer's turn
async function logicDealerTurn() {
  $("#playerButtons").empty();
  displayDealerCards();
  updateScores();

  while (dealer.total <= 16) {
    await drawCard(dealer);
    await displayNewDealerCard();
    updateScores();
  }

  gameState = STATE_REWARD;
  logic();
}

// Handle the end of the game and determine rewards
function logicReward() {
  let resultMessage = "";
  if (player.total > 21) {
    resultMessage = "Player busts. Dealer wins.";
  } else if (dealer.total > 21 || player.total > dealer.total) {
    resultMessage = "Player wins";
    playerMoney += playerBet * 2;
  } else if (dealer.total > player.total) {
    resultMessage = "Dealer wins";
  } else {
    resultMessage = "It's a tie.";
    playerMoney += playerBet;
  }

  alert(resultMessage);
  dealerHasPlayed = false;
  updateBetDisplay();
  gameState = STATE_BETTING;
  logic();
}

// Update the displayed bet and player's total money
function updateBetDisplay() {
  $('#playerScore').text(`Player Money: $${playerMoney}`);
  $('#dealerScore').text(`Current Bet: $${playerBet}`);
}

// Update the scores displayed for player and dealer
function updateScores() {
  $('#playerTotal').text(`Player Total: ${player.total}`);
  $('#dealerTotal').text(`Dealer Total: ${gameState === STATE_DEALERTURN || gameState === STATE_REWARD ? dealer.total : '??'}`);
}

// Initialize game on page load
$(document).ready(function () {
  init();
});
