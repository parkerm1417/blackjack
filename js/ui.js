import {
  player, dealer, gameState, currentHandIndex,
  STATE_DEALERTURN, STATE_REWARD, setDealerHasPlayed,
  dealerHasPlayed
} from './globals.js';

import { getCardBackgroundPosition, getScoreBackgroundPosition } from './utils.js';
import { logic } from './game.js';

// Display the starting hands of the player and dealer
export async function displayStartingHands() {
  $('#dealerHand').empty();
  $('#playerHand').empty();
  $('#playerHand').append('<div id="hand1" class="playerHands"><div class="no-arrow"></div></div>');
  $('#dealerHand').append('<div class="no-arrow"></div>');

  ///////////////////////////////////
  // SET UP AREA FOR DEALER'S HAND //
  ///////////////////////////////////

  // area for dealer's total hand value
  let dealerScorePosition = getScoreBackgroundPosition(`questionMark`);
  let $dealerScore = $('<div class="dealerScore"></div>').css('background-position', dealerScorePosition);
  $('#dealerHand').append($dealerScore);

  // area for dealer's hand
  $('#dealerHand').append('<div class="card-back"></div>');
  let dealerBackgroundPosition = getCardBackgroundPosition(dealer.hand[1]);
  $('#dealerHand').append(`<div class="playingCard" style="background-position: ${dealerBackgroundPosition};"></div>`);


  ///////////////////////////////////
  // SET UP AREA FOR PLAYER'S HAND //
  ///////////////////////////////////

  // area for player's hand value
  let playerScorePosition = getScoreBackgroundPosition(`questionMark`); // start with ? then update
  let $playerScore = $('<div class="hand-total"></div>').css('background-position', playerScorePosition);
  $(`#hand${currentHandIndex + 1}`).append($playerScore);

  // area for player's hand
  player.hands[currentHandIndex].hand.forEach(card => {
    let backgroundPosition = getCardBackgroundPosition(card);
    let $card = $('<div class="playingCard"></div>').css('background-position', backgroundPosition);
    $(`#hand${currentHandIndex + 1}`).append($card);
  });
  await updateScores();
}

// Display all dealer's cards
export async function displayDealerCards() {
  let backgroundPosition = getCardBackgroundPosition(dealer.hand[0]);
  $('.card-back').first().replaceWith(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  setDealerHasPlayed(true);
  await updateScores();
  await new Promise(resolve => setTimeout(resolve, 250));
}

export async function displayNewDealerCard() {
  let card = dealer.hand[dealer.hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  $('#dealerHand').append($card);
  await updateScores();
}

export async function displayNewPlayerCard() {
  let card = player.hands[currentHandIndex].hand[player.hands[currentHandIndex].hand.length - 1];
  let backgroundPosition = getCardBackgroundPosition(card);
  let $card = $(`<div class="playingCard" style="background-position: ${backgroundPosition};"></div>`);
  $(`#hand${currentHandIndex + 1}`).append($card);
  await updateScores();
}

export async function displaySplitHands() {
  /* player.hands.forEach((hand, index) => {
    const handId = `hand${index + 1}`;

    if (index === currentHandIndex) {
      handDiv.append('<div class="arrow"></div><div class="hand-total" style="background-position: -360px 0px;"></div>')
    } else {
      handDiv.append('<div class="arrow"></div><div class="hand-total" style="background-position: -360px 0px;"></div>')
    }
    hand.hand.forEach(card => {
      let backgroundPosition = getCardBackgroundPosition(card);
      let $card = $('<div class="playingCard"></div>').css('background-position', backgroundPosition);
      handDiv.append($card);
    });
    $('#playerHand').append(handDiv);
  }); */
  logic();
}

export async function updateScores(dealerOnly = false) {
  if (!dealerOnly) {
    player.hands.forEach((hand, index) => {
      $(`#hand${index + 1}`).find(`.hand-total`).css('background-position', getScoreBackgroundPosition(hand.total));
    });
    let playerScores = player.hands.map((hand, index) => `HAND ${index + 1}: ${hand.total}`).join("<br>");
    $('#playerTotal').html(playerScores);
  }
  if (dealerHasPlayed) {
    $('.dealerScore').css('background-position', getScoreBackgroundPosition(`${gameState === STATE_DEALERTURN || gameState === STATE_REWARD ? dealer.total : 'questionMark'}`));
    $('#dealerTotal').text(`Dealer Total: ${gameState === STATE_DEALERTURN || gameState === STATE_REWARD ? dealer.total : '?'}`);
  }
}