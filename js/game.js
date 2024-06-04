import { getDeck, drawCardDealer, drawCard, shuffle } from './api.js';
import {
  gameState, STATE_NEWHAND, STATE_PLAYERTURN, STATE_DEALERTURN, STATE_REWARD, STATE_BETTING, STATE_INSURANCE,
  cardsLeft, player, dealer, dealerHasPlayed, BET_AMOUNTS, playerBet, insuranceBet, totalHandBet, playerMoney, currentHandIndex,
  setGameState, setPlayerBet, setCurrentHandIndex, setPlayerMoney, setTotalHandBet, setDealerHasPlayed, setInsuranceBet, newHand,
  setGameWindow, splitHand,
  gameWindow
} from './globals.js';
import { displayStartingHands, displayDealerCards, displayNewDealerCard, displaySplitHands, updateScores } from './ui.js';
import { getButtonBackgroundPosition } from './utils.js';

// Setup div structure and sprites
export function startGame() {
  getDeck(); // INITIALIZE DECK

  // SETUP UIWINDOW CONTENTS
  $('#uiWindow').empty();
  $('#uiWindow').append(`
    <div id="bet-window">
      <div id="bet_increase"></div>
      <div id="bet_amount"></div>
      <div id="bet_decrease"></div>
      <div id="deal"></div>
    </div>
    <div id="hit-stand-window" class="hidden">
      <div id="hit"></div>
      <div id="stand"></div>
      <div id="split-double" class="hidden">
        <div id="split"></div>
        <div id="double"></div>
      </div>
    </div>
    <div id="insurance" class="hidden">
      <div id="ins-yes"></div>
      <div id="ins-no"></div>
    </div>
  `);

  // SET UIWINDOW
  setGameWindow('bet');

  // POPULATE INITIAL HAND CONTENT
  $('#dealerHand').empty();
  $('#dealerHand').append('<div class="no-arrow"></div><div class="dealerScore" style="background-position: -360px 0px;"></div><div class="card-back"></div><div class="card-back"></div>');
  $('#playerHand').empty();
  $('#playerHand').append('<div id="hand1" class="playerHands"><div class="no-arrow"></div><div class="hand-total" style="background-position: -360px 0px;"></div><div class="card-back"></div><div class="card-back"></div></div>');

  // SET UP BUTTON SPRITE POSITIONS
  $('#bet_amount').css('background-position', getButtonBackgroundPosition(`bet${playerBet}`));
  $('#hit').css('background-position', getButtonBackgroundPosition(`hit`));
  $('#stand').css('background-position', getButtonBackgroundPosition(`stand`));
  $('#split').css('background-position', getButtonBackgroundPosition(`splitInactive`));
  $('#double').css('background-position', getButtonBackgroundPosition(`doubleInactive`));
  $('#ins-yes').css('background-position', getButtonBackgroundPosition(`yes`));
  $('#ins-no').css('background-position', getButtonBackgroundPosition(`no`));

  /////////////////////////
  // SETUP BUTTON EVENTS //
  /////////////////////////

  // BET INCREASE BUTTON
  $('#bet_increase').on('click', function () {
    if (playerMoney >= BET_AMOUNTS[playerBet + 1] && playerBet < 7) { setPlayerBet(playerBet + 1); }
    else { setPlayerBet(1); }
  });
  $('#bet_increase').hover(
    function () { $('#bet_increase').css('background-position', getButtonBackgroundPosition(`betIncreaseHover`)); },
    function () { $('#bet_increase').css('background-position', getButtonBackgroundPosition(`betIncrease`)); }
  )

  // BET DECREASE BUTTON
  $('#bet_decrease').on('click', function () {
    if (playerBet > 1) { setPlayerBet(playerBet - 1); }
    else { setPlayerBet(7); }
  });
  $('#bet_decrease').hover(
    function () { $('#bet_decrease').css('background-position', getButtonBackgroundPosition(`betDecreaseHover`)); },
    function () { $('#bet_decrease').css('background-position', getButtonBackgroundPosition(`betDecrease`)); }
  )

  // DEAL BUTTON
  $('#deal').on('click', function () {
    $("#handResult").empty();
    if (playerBet > 0) {
      setTotalHandBet(BET_AMOUNTS[playerBet]);
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet]);
      setGameState(STATE_NEWHAND);
    } else { $("#handResult").append("Place a bet to start the game."); }
  });
  $('#deal').hover(
    function () { $('#deal').css('background-position', getButtonBackgroundPosition(`dealHover`)); },
    function () { $('#deal').css('background-position', getButtonBackgroundPosition(`deal`)); }
  )

  // HIT BUTTON
  $('#hit').on('click', async function () {
    $('#splitDouble').addClass('hidden');
    setGameWindow('hit');
    await drawCard(player, true);
    if (player.hands[currentHandIndex].total > 21) {
      if (player.hands.length > 1 && currentHandIndex < player.hands.length - 1) {
        setCurrentHandIndex(currentHandIndex + 1);
        displaySplitHands();
      } else { setGameState(STATE_REWARD); }
    }
  });
  $('#hit').hover(
    function () { $('#hit').css('background-position', getButtonBackgroundPosition(`hitHover`)); },
    function () { $('#hit').css('background-position', getButtonBackgroundPosition(`hit`)); }
  )

  // STAND BUTTON
  $('#stand').on('click', function () {
    $('#splitDouble').addClass('hidden');
    setGameWindow('hit');
    if (player.hands.length > 1 && currentHandIndex < player.hands.length - 1) {
      setCurrentHandIndex(currentHandIndex + 1);
      displaySplitHands();
    } else { setGameState(STATE_DEALERTURN); }
  });
  $('#stand').hover(
    function () { $('#stand').css('background-position', getButtonBackgroundPosition(`standHover`)); },
    function () { $('#stand').css('background-position', getButtonBackgroundPosition(`stand`)); }
  )

  // DOUBLE BUTTON
  $('#double').on('click', async function () {
    if (playerMoney >= BET_AMOUNTS[playerBet]) {
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet]);
      setTotalHandBet(totalHandBet + BET_AMOUNTS[playerBet]);
      await drawCard(player, true);
      if (player.hands[currentHandIndex].total > 21) {
        if (player.hands.length > 1 && currentHandIndex < player.hands.length - 1) {
          setCurrentHandIndex(currentHandIndex + 1);
          displaySplitHands();
        } else { setGameState(STATE_REWARD); }
      } else { setGameState(STATE_DEALERTURN); }
    } else { $("#handResult").append("Not enough money to double down."); }
  });
  $('#double').hover(
    function () {
      if ($('#double').hasClass('active')) { $('#double').css('background-position', getButtonBackgroundPosition(`doubleHover`)); }
    },
    function () {
      if ($('#double').hasClass('active')) { $('#double').css('background-position', getButtonBackgroundPosition(`double`)); }
    }
  )

  // SPLIT BUTTON
  $('#split').on('click', async function () {
    if (player.hands[currentHandIndex].hand.length === 2 && player.hands[currentHandIndex].hand[0].charAt(0) === player.hands[currentHandIndex].hand[1].charAt(0) && playerMoney >= BET_AMOUNTS[playerBet]) {
      $('#double').removeClass('active');
      setTotalHandBet(totalHandBet + BET_AMOUNTS[playerBet]); // Increase total hand bet
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet]);
      splitHand();
      updateScores();
      displaySplitHands();
    } else { $("#handResult").append("Cannot split this hand."); }
  });
  $('#split').hover(
    function () {
      if ($('#split').hasClass('active')) { $('#split').css('background-position', getButtonBackgroundPosition(`splitHover`)); }
    },
    function () {
      if ($('#split').hasClass('active')) { $('#split').css('background-position', getButtonBackgroundPosition(`split`)); }
    }
  )

  // INSURANCE YES BUTTON
  $('#ins-yes').on('click', async function () {
    if (playerMoney >= BET_AMOUNTS[playerBet] / 2) {
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet] / 2);
      setInsuranceBet(BET_AMOUNTS[playerBet] / 2);
      setTotalHandBet(totalHandBet + insuranceBet);
      if (dealer.total === 21) {
        $('.card-back').remove();
        $("#handResult").html("DEALER HAD BLACKJACK!");
        setPlayerMoney(playerMoney + insuranceBet * 2);
        setGameState(STATE_BETTING); // Hand over, return to betting state
      } else {
        $("#handResult").html("DEALER DOES NOT HAVE BLACKJACK.");
        setGameState(STATE_PLAYERTURN); // Continue hand >> player's turn
      }
    } else { $("#handResult").html("Not enough money for insurance."); }
  });
  $('#ins-yes').hover(
    function () { $('#ins-yes').css('background-position', getButtonBackgroundPosition(`yesHover`)); },
    function () { $('#ins-yes').css('background-position', getButtonBackgroundPosition(`yes`)); }
  )

  // INSURANCE NO BUTTON
  $('#ins-no').on('click', async function () {
    if (dealer.total === 21) {
      $('.card-back').remove();
      $("#handResult").append("DEALER HAD BLACKJACK!");
      setGameState(STATE_BETTING);
    } else { setGameState(STATE_PLAYERTURN); }
  });
  $('#ins-no').hover(
    function () { $('#ins-no').css('background-position', getButtonBackgroundPosition(`noHover`)); },
    function () { $('#ins-no').css('background-position', getButtonBackgroundPosition(`no`)); }
  )

  setGameState(STATE_BETTING);
}

// Main game logic controller
export function logic() {
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
      break;
    case STATE_REWARD:
      logicReward();
      break;
    case STATE_INSURANCE:
      logicInsurance();
      break;
  }
}

// Betting logic
function logicBetting() {
  setGameWindow('bet');
}

// Start a new hand
async function logicNewHand() {
  if (cardsLeft <= 60) { await shuffle(); }
  newHand(); //clear hands to reset game

  await drawCard(player);
  await drawCardDealer(dealer);
  await drawCard(player);
  await drawCardDealer(dealer);

  displayStartingHands();

  if (player.hands[currentHandIndex].total === 21 || (dealerHasPlayed && dealer.total === 21)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!dealerHasPlayed) {
      await displayDealerCards();
    }
    setGameState(STATE_REWARD);
  } else if (dealer.hand[1].charAt(0) === 'A') {
    setGameState(STATE_INSURANCE);
  } else {
    setGameState(STATE_PLAYERTURN);
  }
}

// Handle player's turn
function logicPlayerTurn() {
  let splitActive = false;
  let doubleActive = false;
  $('#double').removeClass('active');
  $('#split').removeClass('active');

  // Show Double Down button if applicable
  if (
    player.hands.length === 1 // if the hand hasn't been split
    && player.hands[0].hand.length === 2 // and the player only has two cards
    && (player.hands[currentHandIndex].total === 9 || player.hands[currentHandIndex].total === 10 || player.hands[currentHandIndex].total === 11) // and the hand equals 9, 10, or 11
    && playerMoney >= BET_AMOUNTS[playerBet]) { // and the player can afford it 
    doubleActive = true; // then double down is applicable
    $('#double').addClass('active');
  }

  // Show Split button if applicable
  if (
    player.hands[currentHandIndex].hand.length === 2  // if the current hand has two cards
    && player.hands[currentHandIndex].hand[0].charAt(0) === player.hands[currentHandIndex].hand[1].charAt(0) // and both cards match value
    && playerMoney >= BET_AMOUNTS[playerBet]) { // and the player can afford it
    splitActive = true; // then split is applicable
    $('#split').addClass('active');
  }

  if (splitActive || doubleActive) {
    setGameWindow('splitDouble');
    splitActive ? $('#split').css('background-position', getButtonBackgroundPosition(`split`)) : $('#split').css('background-position', getButtonBackgroundPosition(`splitInactive`));
    doubleActive ? $('#double').css('background-position', getButtonBackgroundPosition(`double`)) : $('#double').css('background-position', getButtonBackgroundPosition(`doubleInactive`));
  } else {
    setGameWindow('hit');
  }

  $('bet-window').addClass('hidden');
  $('hit-stand-window').removeClass('hidden');
}

// Handle dealer's turn
async function logicDealerTurn() {
  await displayDealerCards();
  while (dealer.total < 17) {
    await drawCardDealer(dealer);
    await displayNewDealerCard();
  }
  setGameState(STATE_REWARD);
}

export async function logicInsurance() {
  setGameWindow('insurance');
}

export async function logicReward() {
  updateScores();
  let playerResults = [];
  if (!dealerHasPlayed) {
    await displayDealerCards();
  }

  player.hands.forEach((hand, index) => {
    let handLabel = player.hands.length > 1 ? `HAND ${index + 1}: ` : "";

    if (hand.total > 21) {
      playerResults.push(`${handLabel}BUST`);
    } else if (dealer.total > 21 || hand.total > dealer.total) {
      playerResults.push(`${handLabel}WIN!`);
      setPlayerMoney(playerMoney + BET_AMOUNTS[playerBet] * 2);
    } else if (dealer.total > hand.total) {
      playerResults.push(`${handLabel}DEALER WINS`);
    } else {
      playerResults.push(`${handLabel}PUSH`);
      setPlayerMoney(playerMoney + BET_AMOUNTS[playerBet]);
    }
  });

  $("#handResult").html(playerResults.join("<br>"));
  setDealerHasPlayed(false);
  if (playerMoney < BET_AMOUNTS[playerBet]) { setPlayerBet(playerMoney); }
  setTotalHandBet(0);
  setGameState(STATE_BETTING);
}

// START GAME (PERFORM SETUP ACTIONS)
$(document).ready(function () { startGame(); });