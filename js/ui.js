import {
  player, dealer, splitHands, totalHandBet, playerMoney, playerBet, gameState, currentHandIndex,
  STATE_DEALERTURN, STATE_REWARD, BET_AMOUNTS,
  setDealerHasPlayed
} from './globals.js';

import { getCardBackgroundPosition, getButtonBackgroundPosition, getScoreBackgroundPosition } from './utils.js';

// Display the starting hands of the player and dealer
export function displayStartingHands() {
  $('#dealerHand').empty();
  $('#playerHand').empty();

  //////////////////////////////////////////////////////////////////////////
  // SET UP SLOT FOR ARROW WHEN THERE'S MULTIPLE HANDS DUE TO USING SPLIT //
  //////////////////////////////////////////////////////////////////////////

  let currentHandPosition = getScoreBackgroundPosition(0); // 0 = blank (used when only one hand)
  let $currentHand = $('<div class="currentHand"></div>').css('background-position', currentHandPosition);
  $('#playerHand').append($currentHand); // add blank to both dealer and player to start 
  $('#dealerHand').append($currentHand); // dealer can't split, but this will keep things aligned

  ///////////////////////////////////
  // SET UP AREA FOR DEALER'S HAND //
  ///////////////////////////////////

  // area for dealer's total hand value
  let dealerScorePosition = getScoreBackgroundPosition(2); // 2 = ?
  let $dealerScore = $('<div class="dealerScore"></div>').css('background-position', dealerScorePosition);
  $('#dealerHand').append($dealerScore);

  // area for dealer's hand
  let dealerBackgroundPosition = getCardBackgroundPosition(dealer.hand[0]);
  $('#dealerHand').append(`<div class="playingCard" style="background-position: ${dealerBackgroundPosition};"></div>`);
  $('#dealerHand').append('<div class="card-back"></div>');

  ///////////////////////////////////
  // SET UP AREA FOR PLAYER'S HAND //
  ///////////////////////////////////

  // area for player's hand value
  let playerScorePosition = getScoreBackgroundPosition(2); // 2 = ? (start with ? then update)
  let $playerScore = $('<div class="playerScore"></div>').css('background-position', playerScorePosition);
  $('#playerHand').append($playerScore);

  // area for player's hand
  player.hand.forEach(card => {
    let backgroundPosition = getCardBackgroundPosition(card);
    let $card = $('<div class="playingCard"></div>').css('background-position', backgroundPosition);
    $('#playerHand').append($card);
  });
}

// Display all dealer's cards
export async function displayDealerCards() {
  $('.card-back').remove();
  dealer.hand.forEach((card, index) => {
    if (index > 0) {
      let backgroundPosition = getCardBackgroundPosition(card);
      $('#dealerHand').append(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
    }
  });
  setDealerHasPlayed(true);
  await new Promise(resolve => setTimeout(resolve, 250));
}

export async function displayNewDealerCard() {
  let card = dealer.hand[dealer.hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  $('#dealerHand').append($card);
}

export async function displayNewPlayerCard() {
  let card = player.hand[player.hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  if (splitHands.length > 0) {
    $(`#hand${currentHandIndex + 1}`).append($card);
  } else {
    $('#playerHand').append($card);
  }
}

export async function displaySplitHands() {
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

export function updateBetDisplay() {
  $('#playerMoney').text(`Player Money: $${playerMoney}`);
  $('#currentBet').text(`Current Bet: $${BET_AMOUNTS[playerBet]}`);
  $('#bet_amount').css('background-position', getButtonBackgroundPosition(`bet${playerBet}`));
  if (totalHandBet > 0) {
    $('#totalHandBet').text(`Total Hand Bet: $${totalHandBet}`);
  } else {
    $('#totalHandBet').text('');
  }
}

export async function updateScores(dealerOnly = false) {
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