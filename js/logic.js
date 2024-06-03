import { drawCard, shuffle } from './api.js';
import {
  gameState, STATE_NEWHAND, STATE_PLAYERTURN, STATE_DEALERTURN, STATE_REWARD, STATE_BETTING, STATE_SPLIT, STATE_INSURANCE,
  cardsLeft, player, dealer, dealerHasPlayed, BET_AMOUNTS, playerBet, insuranceBet, totalHandBet, playerMoney, splitHands, currentHandIndex,
  setGameState, setPlayerBet, setSplitHands, setCurrentHandIndex, setPlayerMoney, setTotalHandBet, setDealerHasPlayed, setInsuranceBet
} from './globals.js';
import { displayStartingHands, displayDealerCards, displayNewDealerCard, displayNewPlayerCard, displaySplitHands, updateBetDisplay, updateScores } from './ui.js';

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
      setDealerHasPlayed(true);
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
    <div id="four-button-box">
      <div id="bet_amount"></div>
      <button class="btn-large" id="bet_increase"></button>
      <button class="btn-large" id="bet_decrease"></button>
      <button class="btn-large" id="deal"></button>
    </div>
  `);

  updateBetDisplay();

  $('#bet_increase').on('click', function () {
    if (playerMoney >= BET_AMOUNTS[playerBet + 1] && playerBet < 7) {
      setPlayerBet(playerBet + 1);
      updateBetDisplay();
    }
  });

  $('#bet_increase').hover(
    function(){
      $('#bet_increase').css('background', 'url(../img/buttons.png) no-repeat 0px -106px / 736px 961px');
    },
    function(){
      $('#bet_increase').css('background', 'url(../img/buttons.png) no-repeat -248px -106px / 736px 961px');
    }
  )

  $('#bet_decrease').on('click', function () {
    if (playerBet > 1) {
      setPlayerBet(playerBet - 1);
      updateBetDisplay();
    }
  });

  $('#bet_decrease').hover(
    function(){
      $('#bet_decrease').css('background', 'url(../img/buttons.png) no-repeat 0px -212px / 736px 961px');
    },
    function(){
      $('#bet_decrease').css('background', 'url(../img/buttons.png) no-repeat -248px -212px / 736px 961px');
    }
  )

  $('#deal').on('click', function () {
    $("#handResult").empty();
    if (playerBet > 0) {
      setTotalHandBet(BET_AMOUNTS[playerBet]);
      $("#playerButtons").empty();
      setGameState(STATE_NEWHAND);
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet]);
      updateBetDisplay();
      logic();
    } else {
      $("#handResult").append("Please place a bet to start the game.");
    }
  });
  $('#deal').hover(
    function(){
      $('#deal').css('background', 'url(../img/buttons.png) no-repeat 0px 0px / 736px 961px');
    },
    function(){
      $('#deal').css('background', 'url(../img/buttons.png) no-repeat -248px 0px / 736px 961px');
    }
  )
}

// Start a new hand
async function logicNewHand() {
  if (cardsLeft <= 60) {
    await shuffle();
  }
  player.hand = [];
  player.total = 0;
  player.aceIs11 = 0;
  dealer.hand = [];
  dealer.total = 0;
  dealer.aceIs11 = 0;
  setSplitHands([]);
  setCurrentHandIndex(0);

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
    setGameState(STATE_REWARD);
  } else if (dealer.hand[0].charAt(0) === 'A') {
    setGameState(STATE_INSURANCE);
  } else {
    setGameState(STATE_PLAYERTURN);
  }
  logic();
}

// Handle player's turn
function logicPlayerTurn() {
  $("#playerButtons").empty();
  let buttonsHtml = `
      <button class="btn-large" id="hit"></button>
      <button class="btn-large" id="stand"></button>
  `;

  // Show Double Down button if applicable
  if (player.hand.length === 2 && (player.total === 9 || player.total === 10 || player.total === 11) && playerMoney >= BET_AMOUNTS[playerBet] && splitHands.length === 0) {
    buttonsHtml = '<div id="four-button-box">' + buttonsHtml;
    buttonsHtml += `<button class="btn-large" id="double"></button>`;
  }

  // Show Split button if applicable
  if (player.hand.length === 2 && player.hand[0].charAt(0) === player.hand[1].charAt(0) && playerMoney >= BET_AMOUNTS[playerBet]) {
    if(buttonsHtml[1] != "d"){
      buttonsHtml = '<div id="four-button-box">' + buttonsHtml;
    }
    buttonsHtml += `<button class="btn-large" id="split"></button>`;
  }

  if(buttonsHtml[1] != "d"){
    buttonsHtml = '<div id="two-button-box">' + buttonsHtml;
  }

  buttonsHtml += '</div>';

  $("#playerButtons").html(buttonsHtml);

  $('#hit').on('click', async function () {
    $('#double').remove();
    $('#split').remove();
    await drawCard(player);
    await displayNewPlayerCard();
    if (player.total > 21) {
      if (splitHands.length > 0 && currentHandIndex < splitHands.length - 1) {
        splitHands[currentHandIndex] = { ...player };
        setCurrentHandIndex(currentHandIndex + 1);
        Object.assign(player, splitHands[currentHandIndex]);
        displaySplitHands();
      } else {
        setGameState(STATE_REWARD);
      }
      logic();
    }
  });

  $('#hit').hover(
    function(){
      $('#hit').css('background', 'url(../img/buttons.png) no-repeat 0px -318px / 736px 961px');
    },
    function(){
      $('#hit').css('background', 'url(../img/buttons.png) no-repeat -248px -318px / 736px 961px');
    }
  )

  $('#stand').on('click', function () {
    $('#double').remove();
    $('#split').remove();
    if (splitHands.length > 0 && currentHandIndex < splitHands.length - 1) {
      splitHands[currentHandIndex] = { ...player };
      setCurrentHandIndex(currentHandIndex + 1);
      Object.assign(player, splitHands[currentHandIndex]);
      displaySplitHands();
    } else {
      setGameState(STATE_DEALERTURN);
    }
    logic();
  });

  $('#stand').hover(
    function(){
      $('#stand').css('background', 'url(../img/buttons.png) no-repeat 0px -424px / 736px 961px');
    },
    function(){
      $('#stand').css('background', 'url(../img/buttons.png) no-repeat -248px -424px / 736px 961px');
    }
  )

  $('#double').on('click', async function () {
    if (playerMoney >= BET_AMOUNTS[playerBet]) {
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet]);
      setTotalHandBet(totalHandBet + BET_AMOUNTS[playerBet]);
      await drawCard(player);
      await displayNewPlayerCard();
      updateBetDisplay();
      if (player.total > 21) {
        if (splitHands.length > 0 && currentHandIndex < splitHands.length - 1) {
          splitHands[currentHandIndex] = { ...player };
          setCurrentHandIndex(currentHandIndex + 1);
          Object.assign(player, splitHands[currentHandIndex]);
          displaySplitHands();
        } else {
          setGameState(STATE_REWARD);
          logic();
        }
      } else {
        setGameState(STATE_DEALERTURN);
        logic();
      }
    } else {
      $("#handResult").append("Not enough money to double down.");
    }
  });

  $('#double').hover(
    function(){
      $('#double').css('background', 'url(../img/buttons.png) no-repeat 0px -859px / 736px 961px');
    },
    function(){
      $('#double').css('background', 'url(../img/buttons.png) no-repeat -248px -859px / 736px 961px');
    }
  )

  $('#split').on('click', async function () {
    $('#double').remove();
    if (player.hand.length === 2 && player.hand[0].charAt(0) === player.hand[1].charAt(0) && playerMoney >= BET_AMOUNTS[playerBet]) {
      setTotalHandBet(totalHandBet + BET_AMOUNTS[playerBet]); // Increase total hand bet
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet]);
      updateBetDisplay();
      splitHands.push({ hand: [player.hand.pop()], total: player.total / 2, aceIs11: player.aceIs11 });
      splitHands.push({ hand: [player.hand.pop()], total: player.total / 2, aceIs11: player.aceIs11 });
      player.hand = [];
      player.total = 0;
      player.aceIs11 = 0;
      await drawCard(player);
      await drawCard(splitHands[0]);
      await drawCard(splitHands[1]);
      setGameState(STATE_SPLIT);
      logic();
    } else {
      $("#handResult").append("Cannot split this hand.");
    }
  });

  $('#split').hover(
    function(){
      $('#split').css('background', 'url(../img/buttons.png) no-repeat 0px -751px / 736px 961px');
    },
    function(){
      $('#split').css('background', 'url(../img/buttons.png) no-repeat -248px -751px / 736px 961px');
    }
  )
}

// Handle split logic
function logicSplit() {
  Object.assign(player, splitHands[currentHandIndex]);
  displaySplitHands();
  setGameState(STATE_PLAYERTURN);
  logic();
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

  setGameState(STATE_REWARD);
  logic();
}

export async function logicInsurance() {
  $("#playerButtons").empty();
  $("#playerButtons").append(`
    <div id="ins-button-box">
      <button class="btn-large" id="ins-yes"></button>
      <button class="btn-large" id="ins-no"></button>
    </div>
  `);

  $('#ins-yes').on('click', async function () {
    if (playerMoney >= BET_AMOUNTS[playerBet] / 2) {
      setPlayerMoney(playerMoney - BET_AMOUNTS[playerBet] / 2);
      setInsuranceBet(BET_AMOUNTS[playerBet] / 2);
      setTotalHandBet(totalHandBet + insuranceBet);
      if (dealer.total === 21) {
        if (!dealerHasPlayed) {
          await displayDealerCards();
          await updateScores(true);
        }
        $("#handResult").html("DEALER HAD BLACKJACK!");
        setPlayerMoney(playerMoney + insuranceBet * 2);
        setGameState(STATE_BETTING); // Hand over, return to betting state
      } else {
        $("#handResult").html("DEALER DOES NOT HAVE BLACKJACK.");
        setGameState(STATE_PLAYERTURN); // Continue hand >> player's turn
      }
      updateBetDisplay();
      logic();
    } else {
      $("#handResult").html("Not enough money for insurance.");
    }
  });

  $('#ins-yes').hover(
    function(){
      $('#ins-yes').css('background', 'url(../img/buttons.png) no-repeat 0px -535px / 736px 961px');
    },
    function(){
      $('#ins-yes').css('background', 'url(../img/buttons.png) no-repeat -248px -535px / 736px 961px');
    }
  )

  $('#ins-no').on('click', async function () {
    if (dealer.total === 21) {
      if (!dealerHasPlayed) {
        await displayDealerCards();
        await updateScores(true);
      }
      $("#handResult").append("DEALER HAD BLACKJACK!");
      setGameState(STATE_BETTING);
    } else {
      setGameState(STATE_PLAYERTURN);
    }
    logic();
  });

  $('#ins-no').hover(
    function(){
      $('#ins-no').css('background', 'url(../img/buttons.png) no-repeat 0px -643px / 736px 961px');
    },
    function(){
      $('#ins-no').css('background', 'url(../img/buttons.png) no-repeat -248px -643px / 736px 961px');
    }
  )
}

export async function logicReward() {
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
  if (playerMoney < BET_AMOUNTS[playerBet]) {
    setPlayerBet(playerMoney);
  }
  updateBetDisplay();
  setTotalHandBet(0);
  setGameState(STATE_BETTING);
  logic();
}