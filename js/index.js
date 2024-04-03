var deckId = "";
var player1 = {
  hand: [],
  total: 0
}
var dealer1 = {
  hand: [],
  total: 0
}

async function init(){
  await $.getJSON('http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6', function(data){deckId = data.deck_id});
  console.log(deckId);
}

async function shuffle(){
  await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckId}/shuffle/`, 
    function(data){
      if(data.shuffled != true){
        shuffle();
      }
  });
}

async function drawCard() {
  await $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/draw/?count=1`, 
  function(data){
    data.cards[0].name = data.cards[0].value;
    var temp = data.cards[0].name;

    if (temp === 'KING' || temp === 'QUEEN' || temp === 'JACK') {
      data.cards[0].value = 10;
    }
    else if (temp === 'ACE') {
      data.cards[0].value = 11;
    }
    else {
      data.cards[0].value = parseInt(temp);
    }
    return data.cards
  });
};

(function() {
  'use strict';

  var renderGame = function() {
    $('.removable').remove();

    var $xhr = $.getJSON('http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6');

    $xhr.done(function(deck) {
      if ($xhr.status !== 200) {
        return;
      }
      var deckID = deck.deck_id;
      var cardsLeft = deck.remaining;

      var player = {
        hand: [],
        money: 500,
        hasBlackjack: false,
        hasAce: false, // for unused aces
        total: 0
      };

      var dealer = {
        hand: [], // playing with first card of dealerHand face down
        hasBlackjack: false,
        hasAce: false, // for unused aces
        total: 0
      };

      $('.navbar-fixed').after('<div id="board" class="center-align"></div');
      var $board = $('#board');

      var displayGame = function() {
      };

      var shuffle = function() {
        var $shuffled = $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/shuffle/`);

        $shuffled.done(function(data) {
          if ($shuffled.status !== 200) {
            return;
          }
          if (data.shuffled !== true) {
            shuffle();

            return;
          }
          cardsLeft = data.remaining;
        });
        $shuffled.fail(function(err) {
          console.log(err);
        });
      };

      var shuffleCheck = function() {
        if (cardsLeft <= 60) { shuffle(deckID); }
      };

      var endGame = function(winner) {
        if (winner === 'player') {
          Materialize.toast('CONGRATULATIONS, YOU WON!', 6000, 'rounded');
        }
        else if (winner === 'dealer') {
          Materialize.toast('Dealer Won!', 6000, 'rounded');
        }
        else {
          Materialize.toast("Wow, it's a Tie!", 6000, 'rounded');
        }
      };

      var draw = function() {
        var $cardDrawn = $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/draw/?count=1`);

        $cardDrawn.done(function(data) {
          if ($cardDrawn.status !== 200) {
            return;
          }
          cardsLeft = data.remaining;
          data.cards[0].name = data.cards[0].value;
          var temp = data.cards[0].name;

          if (temp === 'KING' || temp === 'QUEEN' || temp === 'JACK') {
            data.cards[0].value = 10;
          }
          else if (temp === 'ACE') {
            data.cards[0].value = 11;
          }
          else {
            data.cards[0].value = parseInt(temp);
          }
        });

        $cardDrawn.fail(function(err) {
          console.log(err);
        });

        return $cardDrawn;
      };

      var displayHands = function() {
        $('#dealerHand').empty();
        $('#playerHand').empty();

        for (var card of player.hand){
          var imageURL = card.image;
          var $card = $(`<img src=${imageURL} class='playingCard'>`);
          $('#playerHand').append($card);
        }

        var placeholder = dealer.hand[0].image;
        $('#dealerHand').append(`<img src=${placeholder} class='playingCard'>`);

        placeholder = dealer.hand[1].image;
        $('#dealerHand').append('<div class="card-back"></div>');
      };

      var displayNewDealerCard = function() {
        var imageURL = dealer.hand[dealer.hand.length-1].image;
        var $card = $(`<img src=${imageURL} class='playingCard'>`);

        $('#dealerHand').append($card);
      };

      var displayNewPlayerCard = function() {
        var imageURL = player.hand[player.hand.length-1].image;
        var $card = $(`<img src=${imageURL} class='playingCard'>`);

        $('#playerHand').append($card);
      };

      var calculateHand = function(person) {
        var total = 0;

        for (var card of person.hand) {
          total += card.value;
          if (card.value === 11) { person.hasAce = true; }
        }
        if (total === 21) { person.hasBlackjack = true; }

        return total;
      };

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

      var deal = function() {
        var $promise = $.when(draw(), draw(), draw(), draw());

        $promise.done(function (data1, data2, data3, data4) {
          player.hand.push(data1[0].cards[0]);
          dealer.hand.push(data2[0].cards[0]);
          player.hand.push(data3[0].cards[0]);
          dealer.hand.push(data4[0].cards[0]);
          displayHands();
          updateTotal(player, calculateHand(player));
          calculateHand(dealer);
          updateTotal(dealer, dealer.hand[0].value);
          playerTurn();
        });
      };

      var startGame = function() {
        $('#restart').on('click', restartGame);
        deal();
      };

      var restartGame = function() {
        shuffleCheck();
        player.hand = [];
        dealer.hand = [];
        player.hasAce = false;
        dealer.hasAce = false;
        player.hasBlackjack = false;
        dealer.hasBlackjack = false;
        $('#toast-container').remove();
        $('#restart').off();
        startGame();
      };

      displayGame();
      startGame();
    });
    $xhr.fail(function(err) {
      console.log(err);
    });
  }; // end of renderGame()

  $('#start').on('click', function() {
    renderGame();
  });
})();
