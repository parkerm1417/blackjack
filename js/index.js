// GLOBAL VARIABLES
const STATE_NEWHAND = 0;
const STATE_PLAYERTURN = 1;
const STATE_DEALERTURN = 2;
const STATE_REWARD = 3;
const STATE_BETTING = 4;
const STATE_SPLIT = 5;
const STATE_INSURANCE = 6;

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
let totalHandBet = 0; // Total bet across all hands
let playerMoney = 1000; // Player's total money
let insuranceBet = 0; // Insurance bet
let splitHands = []; // Array to hold split hands
let currentHandIndex = 0; // Index of the current hand being played

// Player and Dealer objects to hold their respective hands and totals
let player = { hand: [], total: 0, aceIs11: false };
let dealer = { hand: [], total: 0, aceIs11: false };

// FUNCTIONS

// Initialize the game by shuffling a new deck and logging the deck ID
async function init() {
  try {
    const data = await $.getJSON(`http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${deck_count}`);
    deckId = data.deck_id;
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
    await updateTotal(person, card.value);
    cardsLeft = data.remaining;
    await updateScores();
  } catch (error) {
    console.error("Error drawing card:", error);
  }
}

// Update the total score for the person based on the drawn card's value
async function updateTotal(person, cardValue) {
  // Handle logic for face cards (King, Queen, Jack)
  if (['KING', 'QUEEN', 'JACK'].includes(cardValue)) {
    person.total += 10;

    // Handle logic for aces (default to 11, then adjust if needed)
  } else if (cardValue === 'ACE') {
    person.total += 11;
    person.aceIs11 = true;

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

// Find the location for the card on the sprite sheet
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
async function displayDealerCards() {
  $('.card-back').remove();
  dealer.hand.forEach((card, index) => {
    if (index > 0) {
      let backgroundPosition = getCardBackgroundPosition(card);
      $('#dealerHand').append(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
    }
  });
  await new Promise(resolve => setTimeout(resolve, 250));
}

async function displayNewDealerCard() {
  let card = dealer.hand[dealer.hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  $('#dealerHand').append($card);
}

async function displayNewPlayerCard() {
  let card = player.hand[player.hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  if (splitHands.length > 0) {
    $(`#hand${currentHandIndex + 1}`).append($card);
  } else {
    $('#playerHand').append($card);
  }
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
    case STATE_SPLIT:
      logicSplit();
      break;
    case STATE_INSURANCE:
      logicInsurance();
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
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="deal">Deal</button>
    </div>
  `);

  $('#bet_increase').on('click', function () {
    if (playerMoney >= playerBet + 10) {
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

  $('#deal').on('click', function () {
    $("#handResult").empty();
    if (playerBet > 0) {
      totalHandBet = playerBet;
      $("#playerButtons").empty();
      gameState = STATE_NEWHAND;
      playerMoney -= playerBet;
      updateBetDisplay();
      logic();
    } else {
      $("#handResult").append("Please place a bet to start the game.");
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
  splitHands = [];
  currentHandIndex = 0;

  await drawCard(player);
  await drawCard(player);
  await drawCard(dealer);
  await drawCard(dealer);

  displayStartingHands();
  await updateScores();

  if (player.total === 21 || (dealerHasPlayed && dealer.total === 21)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!dealerHasPlayed) {
      await displayDealerCards();
      await updateScores(true);
    }
    gameState = STATE_REWARD;
  } else if (dealer.hand[0].charAt(0) === 'A') {
    gameState = STATE_INSURANCE;
  } else {
    gameState = STATE_PLAYERTURN;
  }
  logic();
}

// Handle player's turn
function logicPlayerTurn() {
  $("#playerButtons").empty();
  let buttonsHtml = `
    <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="hit">Hit</button>
    <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="stand">Stand</button>
  `;

  // Show Double Down button if applicable
  if (player.hand.length === 2 && (player.total === 9 || player.total === 10 || player.total === 11) && playerMoney >= playerBet && splitHands.length === 0) {
    buttonsHtml += `<button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="double">Double Down</button>`;
  }

  // Show Split button if applicable
  if (player.hand.length === 2 && player.hand[0].charAt(0) === player.hand[1].charAt(0) && playerMoney >= playerBet) {
    buttonsHtml += `<button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="split">Split</button>`;
  }

  $("#playerButtons").html(buttonsHtml);

  $('#hit').on('click', async function () {
    $('#double').remove();
    await drawCard(player);
    await displayNewPlayerCard();
    if (player.total > 21) {
      if (splitHands.length > 0 && currentHandIndex < splitHands.length - 1) {
        splitHands[currentHandIndex] = { ...player };
        currentHandIndex++;
        player = splitHands[currentHandIndex];
        displaySplitHands();
      } else {
        gameState = STATE_REWARD;
      }
      logic();
    }
  });

  $('#stand').on('click', function () {
    $('#double').remove();
    if (splitHands.length > 0 && currentHandIndex < splitHands.length - 1) {
      splitHands[currentHandIndex] = { ...player };
      currentHandIndex++;
      player = splitHands[currentHandIndex];
      displaySplitHands();
    } else {
      gameState = STATE_DEALERTURN;
    }
    logic();
  });

  $('#double').on('click', async function () {
    if (playerMoney >= playerBet) {
      playerMoney -= playerBet;
      totalHandBet += playerBet;
      await drawCard(player);
      await displayNewPlayerCard();
      updateBetDisplay();
      if (player.total > 21) {
        if (splitHands.length > 0 && currentHandIndex < splitHands.length - 1) {
          splitHands[currentHandIndex] = { ...player };
          currentHandIndex++;
          player = splitHands[currentHandIndex];
          displaySplitHands();
        } else {
          gameState = STATE_REWARD;
          logic();
        }
      } else {
        gameState = STATE_DEALERTURN;
        logic();
      }
      
    } else {
      $("#handResult").append("Not enough money to double down.");
    }
  });

  $('#split').on('click', async function () {
    $('#double').remove();
    if (player.hand.length === 2 && player.hand[0].charAt(0) === player.hand[1].charAt(0) && playerMoney >= playerBet) {
      totalHandBet += playerBet; // Increase total hand bet
      playerMoney -= playerBet;
      updateBetDisplay();
      splitHands.push({ hand: [player.hand.pop()], total: player.total / 2, aceIs11: player.aceIs11 });
      splitHands.push({ hand: [player.hand.pop()], total: player.total / 2, aceIs11: player.aceIs11 });
      player.hand = [];
      player.total = 0;
      player.aceIs11 = false;
      await drawCard(player);
      await drawCard(splitHands[0]);
      await drawCard(splitHands[1]);
      gameState = STATE_SPLIT;
      logic();
    } else {
      $("#handResult").append("Cannot split this hand.");
    }
  });
}

// Handle split logic
function logicSplit() {
  player = splitHands[currentHandIndex];
  displaySplitHands();
  gameState = STATE_PLAYERTURN;
  logic();
}

async function displaySplitHands() {
  $('#playerHand').empty();
  splitHands.forEach((hand, index) => {
    const handId = `hand${index + 1}`;
    const handDiv = $(`<div id="${handId}" class="splitHand"></div>`).css({
      'width': 'fit-content',
      'padding-top': '4px',
      'border': index === currentHandIndex ? '2px solid red' : 'none'
    });
    hand.hand.forEach(card => {
      let backgroundPosition = getCardBackgroundPosition(card);
      let $card = $('<div class="playingCard"></div>').css('background-position', backgroundPosition);
      handDiv.append($card);
    });
    $('#playerHand').append(handDiv);
  });
  await updateScores();
}

// Handle dealer's turn
async function logicDealerTurn() {
  $("#playerButtons").empty();
  await displayDealerCards();
  await updateScores();

  while (dealer.total < 17) {
    await drawCard(dealer);
    await displayNewDealerCard();
    await updateScores();
  }

  gameState = STATE_REWARD;
  logic();
}

// Handle the end of the game and determine rewards
async function logicReward() {
  let playerResults = [];
  let handsToCheck = splitHands.length > 0 ? splitHands : [{ ...player }];

  if (!dealerHasPlayed) {
    await displayDealerCards();
    await updateScores(true);
  }

  handsToCheck.forEach((hand, index) => {
    let handLabel = splitHands.length > 0 ? `HAND ${index + 1}: ` : "";

    if (hand.total > 21) {
      playerResults.push(`${handLabel}BUST`);
    } else if (dealer.total > 21 || hand.total > dealer.total) {
      playerResults.push(`${handLabel}WIN!`);
      playerMoney += playerBet * 2;
    } else if (dealer.total > hand.total) {
      playerResults.push(`${handLabel}DEALER WINS`);
    } else {
      playerResults.push(`${handLabel}PUSH`);
      playerMoney += playerBet;
    }
  });

  $("#handResult").html(playerResults.join("<br>"));
  dealerHasPlayed = false;
  if (playerMoney < playerBet){
    playerBet = playerMoney;
  }
  updateBetDisplay();
  totalHandBet = 0;
  gameState = STATE_BETTING;
  logic();
}

// Handle insurance logic
async function logicInsurance() {
  $("#playerButtons").empty();
  $("#playerButtons").append(`
    <div id="insurance-buttons">
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="insurance_yes">Insurance</button>
      <button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="insurance_no">No Insurance</button>
      <br> IF DEALER HAS BLACKJACK, INSURANCE PAYS 2:1.
    </div>
  `);

  $('#insurance_yes').on('click', async function () {
    if (playerMoney >= playerBet / 2) {
      playerMoney -= playerBet / 2;
      insuranceBet = playerBet / 2;
      totalHandBet += insuranceBet;
      if (dealer.total === 21) {
        if (!dealerHasPlayed) {
          await displayDealerCards();
          await updateScores(true);
        }
        $("#handResult").append("DEALER HAD BLACKJACK!");
        playerMoney += insuranceBet * 2;
        gameState = STATE_BETTING; // Hand over, return to betting state
      } else {
        $("#handResult").append("DEALER DOES NOT HAVE BLACKJACK.");
        gameState = STATE_PLAYERTURN; // Continue hand >> players turn
      }
      logic();
    } else {
      $("#handResult").append("Not enough money for insurance.");
    }
  });

  $('#insurance_no').on('click', function () {
    gameState = STATE_PLAYERTURN;
    logic();
  });
}

// Update the displayed bet and player's total money
function updateBetDisplay() {
  $('#playerMoney').text(`Player Money: $${playerMoney}`);
  $('#currentBet').text(`Current Bet: $${playerBet}`);
  if(totalHandBet > 0){
    $('#totalHandBet').text(`Total Hand Bet: $${totalHandBet}`);
  }else{
    $('#totalHandBet').text(``);
  }
}

// Update the scores displayed for player and dealer
async function updateScores(dealerOnly = false) {
  if (!dealerOnly) {
    if (splitHands.length > 0) {
      let playerScores = splitHands.map((hand, index) => `HAND ${index + 1}: ${hand.total}`).join("<br>");
      $('#playerTotal').html(playerScores);
    } else {
      $('#playerTotal').text(`Player Total: ${player.total}`);
    }
  }
  $('#dealerTotal').text(`Dealer Total: ${gameState === STATE_DEALERTURN || gameState === STATE_REWARD ? dealer.total : '??'}`);
}

// Initialize game on page load
$(document).ready(function () {
  init();
});