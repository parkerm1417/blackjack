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
  $('#playerHand').append('<div id="hand1" class="no-arrow"></div>');
  $('#dealerHand').append('<div class="no-arrow"></div>');

  ///////////////////////////////////
  // SET UP AREA FOR DEALER'S HAND //
  ///////////////////////////////////

  // area for dealer's total hand value
  let dealerScorePosition = getScoreBackgroundPosition(`questionMark`);
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
  let playerScorePosition = getScoreBackgroundPosition(`questionMark`); // start with ? then update
  let $playerScore = $('<div class="hand-total"></div>').css('background-position', playerScorePosition);
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
      splitHands.forEach((hand) => {
        $(`#hand${index + 1}`).next(`.hand-total`).css('background-position', getScoreBackgroundPosition(hand.total));
      });
      let playerScores = splitHands.map((hand, index) => `HAND ${index + 1}: ${hand.total}`).join("<br>");
      $('#playerTotal').html(playerScores);
    } else {
      $(`#hand1`).next(`.hand-total`).css('background-position', getScoreBackgroundPosition(player.total));
      $('#playerTotal').text(`Player Total: ${player.total}`);
    }
  }

  $('.dealerScore').css('background-position', getScoreBackgroundPosition(`${gameState === STATE_DEALERTURN || gameState === STATE_REWARD ? dealer.total : 'questionMark'}`));
  $('#dealerTotal').text(`Dealer Total: ${gameState === STATE_DEALERTURN || gameState === STATE_REWARD ? dealer.total : '?'}`);
}