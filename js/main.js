import { init } from './api.js';

// Initialize game on page load
$(document).ready(function () {
  init();
  $('#dealerHand').empty();
  $('#playerHand').empty();

  $('#playerHand').append('<div class="card-back"></div>');
  $('#playerHand').append('<div class="card-back"></div>');
  $('#dealerHand').append('<div class="card-back"></div>');
  $('#dealerHand').append('<div class="card-back"></div>');
});
