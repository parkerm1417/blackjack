import { init } from './api.js';

// Initialize game on page load
$(document).ready(function () {
  init();
  $('#dealerHand').empty();
  $('#playerHand').empty();
  $('#playerHand').append('<div class="no-arrow" id="hand1"></div><div class="hand-total"></div><div class="card-back"></div><div class="card-back"></div>');
  $('#dealerHand').append('<div class="no-arrow"></div><div class="hand-total"></div><div class="card-back"></div><div class="card-back"></div>');
});

