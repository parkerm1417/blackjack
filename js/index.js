//GLOBAL VARIABLES
const STATE_NEWHAND = 0;
const STATE_PLAYERTURN = 1;
const STATE_DEALERTURN = 2;
const STATE_REWARD = 3;
const STATE_BETTING = 4;
var gameState = STATE_BETTING;
var deckId = "";

var player = {
  hand: [],
  total: 0,
  aceIs11: false
}
var dealer = {
  hand: [],
  total: 0,
  aceIs11: false
}

//FUNCTIONS
async function init(){
  //have a deck be shuffled and log the deck ID for future use
  await $.getJSON('http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6', function(data){deckId = data.deck_id});
  console.log(deckId);
}

async function shuffle(){
  //shuffle the deck
  await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckId}/shuffle/`, 
    function(data){
      if(data.shuffled != true){
        shuffle();
      }
  });
}

async function drawCard(person){
  //draw a card from the deck
  await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/draw/?count=1`, 
  function(data){
    //add the card to the hand of the person for which the card was drawn
    person.hand.push(data.cards[0].code)
    //get the name of the card
    var cardName = data.cards[0].value;

    if (cardName === 'KING' || cardName === 'QUEEN' || cardName === 'JACK') {
      //check to see if the person has an ace worth 11 and if the new card would bust them
      if(person.aceIs11 == true && person.total >= 11){
        //if the new card would bust them, then the total is unchanged since their ace becomes 1 and then 10 is added by the face card
        person.aceIs11 = false;
      }
      else{
        //otherwise add 10 for the face card
        person.total += 10;
      }
    }
    else if (cardName === 'ACE') {
      //check if the ace would bust them
      if(person.total <= 10){
        //if not, add 11 for the ace and mark that they have an ace worth 11
        person.total += 11;
        person.aceIs11 = true;
      }
      else{
        //if it would bust them, make the ace worth 1
        person.total += 1;
      }
    }
    //This else block will occur for all cards 2-10
    else {
      //check if the person has an ace worth 11 and if this new card would make them bust
      if(person.aceIs11 == true && (person.total + parseInt(cardName)) > 21){
        //If so, convert the ace to a 1 and mark that they no longer have an ace worth 11
        person.total -= 10;
        person.aceIs11 = false;
      }
      //Add the value of the card to the person's total
      person.total += parseInt(cardName);
    }
  });
};

function displayStartingHands(){
  //clear the divs
  $('#dealerHand').empty();
  $('#playerHand').empty();

  //loop through the two card for the player and get the image for each and display each in its own div
  for (var card of player.hand){
    var imageURL = "https://deckofcardsapi.com/static/img/" + card + ".png";
    var $card = $(`<img src=${imageURL} class='playingCard'>`);
    $('#playerHand').append($card);
  }

  //Display only the first card of the dealer and then the card back for the second card
  var imageURL = "https://deckofcardsapi.com/static/img/" + dealer.hand[0] + ".png";
  $('#dealerHand').append(`<img src=${placeholder} class='playingCard'>`);
  $('#dealerHand').append('<div class="card-back"></div>');
};

function displayDealerCards(){
  //remove the flipped over card
  $('.card-back').remove();
  //display the second card of the dealer
  var imageURL = "https://deckofcardsapi.com/static/img/" + dealer.hand[1] + ".png";
  $('#dealerHand').append(`<img src=${imageURL} class='playingCard'>`);
};

function displayNewDealerCard(){
  //get the image for a newly drawn card for the dealer and add it to the dealerHand div
  var imageURL = "https://deckofcardsapi.com/static/img/" + dealer.hand[dealer.hand.length-1] + ".png";
  var $card = $(`<img src=${imageURL} class='playingCard'>`);
  $('#dealerHand').append($card);
};

function displayNewPlayerCard(){
  //get the image for a newly drawn card for the player and add it to the playerHand div
  var imageURL = player.hand[player.hand.length-1].image;
  var $card = $(`<img src=${imageURL} class='playingCard'>`);
  $('#playerHand').append($card);
};

//Logic Functions

function logic() {
  switch (game_state) {
      case STATE_BETTING:
          logic_betting();
          break;
      case STATE_NEWHAND:
          logic_newHand();
          break;
      case STATE_PLAYERTURN:
          logic_playerTurn();
          break;
      case STATE_DEALERTURN:
          logic_dealerTurn();
          break;
      case STATE_REWARD:
          logic_reward();
          break;
  }
}

function logic_betting(){
  $("#playerButtons").empty();
  $("#playerButtons").append('<div id="betting-buttons"><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="bet+">Bet+</button><p></p><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="bet-">Bet-</button></div>');

}

function logic_newHand(){
  if (cardsLeft <= 60) {shuffle(deckID);}
  player = {hand: [], total: 0};
  dealer = {hand: [], total: 0};

  drawCard(player);
  drawCard(player);
  drawCard(dealer);
  drawCard(dealer);

  displayStartingHands();

  if(player.total == 21 && dealer.total == 21){

  }
  else if(player.total == 21){

  }
  else if(dealer.total == 21){

  }
  else{
    gameState = STATE_PLAYERTURN;
  }
}

function logic_playerTurn(){
  $("#playerButtons").empty();
  $("#playerButtons").append('<div id="playerTurn-buttons"><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="hit">Hit+</button><p></p><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="stand">Stand-</button></div>');

}

function logic_dealerTurn(){
  $("#playerButtons").empty();
  while(dealer.total <= 16){
    drawCard(dealer);
    displayNewDealerCard();
  }
}

function logic_reward(){

}

(function() {
      var calculateWinner = function() {
        if (player.total > dealer.total) {
          endGame('player');

          return;
        }

        if (dealer.total > player.total) {
          endGame('dealer');

          return;
        }

        endGame('tie');
      };

      var changeAce = function(person) {
        for (var card of person.hand) {
          if (card.value === 11) {
            card.value = 1;
            person.hasAce = false;

            return; // just in case 2 aces and only want to alter 1
          }
        }
      };

      var displayTotal = function(person) {
        if (person === dealer) {
          $('#dealer-total').text(person.total);
        }
        if (person === player) {
          $('#player-total').text(person.total);
        }
      };

      var updateTotal = function(person, amount) {
        person.total = amount;
        displayTotal(person);
      };

      var displayDealerCards = function() {
        $('.card-back').remove();
        var secondCard = dealer.hand[1].image;
        $('#dealerHand').append(`<img src=${secondCard} class='playingCard'>`);
      };

      var dealerHit = function() {
        var $promise = $.when(draw());

        $promise.done(function(data) {
          dealer.hand.push(data.cards[0]);
          displayNewDealerCard();
          dealerTurn();

          return;
        });
      };

      var dealerTurn = function() {
        updateTotal(dealer, calculateHand(dealer));

        if (dealer.total === 21) {
          Materialize.toast('Dealer has Blackjack!', 6000, 'rounded');
          player.hasBlackjack ? endGame('tie') : endGame('dealer');

          return;
        }

        if (dealer.total > 21) {
          if (dealer.hasAce) {
            changeAce(dealer);
            dealerTurn();

            return;
          }
          else {
            Materialize.toast('Dealer Busted', 6000, 'rounded');
            endGame('player');

            return;
          }
        }

        if (dealer.total < 21 && dealer.total >= 17) {
          calculateWinner();

          return;
        }

        if (dealer.total <= 16) {
          dealerHit();

          return;
        }
      };

      var endPlayerTurn = function() {
        $('#hit').off();
        $('#stand').off();
        displayDealerCards();
      };

      var playerHit = function() {
        var $promise = $.when(draw());

        $promise.done(function(data) {
          player.hand.push(data.cards[0]);
          displayNewPlayerCard();
          playerTurn();

          return;
        });
      };

      var playerTurn = function() {
        updateTotal(player, calculateHand(player));
        if (player.hasBlackjack) {
          Materialize.toast('You have Blackjack!', 6000, 'rounded');
          endPlayerTurn();
          dealerTurn();

          return;
        }

        if (player.total > 21) {
          if (player.hasAce) {
            changeAce(player);
            playerTurn();

            return;
          }
          else {
            Materialize.toast('You Busted', 6000, 'rounded');
            endPlayerTurn();
            endGame('dealer');

            return;
          }
        }

        $('#hit').off();
        $('#stand').off();

        $('#hit').on('click', function() {
          playerHit();

          return;
        });

        $('#stand').on('click', function() {
          endPlayerTurn();
          dealerTurn();

          return;
        });
      };

      displayGame();
      startGame();
    });
    $xhr.fail(function(err) {
      console.log(err);
    });
 // end of renderGame()

  $('#start').on('click', function() {
    renderGame();
  });
