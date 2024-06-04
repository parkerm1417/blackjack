import { init } from './api.js';

// Initialize game on page load
$(document).ready(function () {
  init();
  $('#dealerHand').empty();
  $('#dealerHand').append('<div class="no-arrow"></div><div class="dealerScore" style="background-position: -360px 0px;"></div><div class="card-back"></div><div class="card-back"></div>');
  $('#playerHand').empty();
  $('#playerHand').append('<div id="hand1" class="no-arrow"></div><div class="hand-total" style="background-position: -360px 0px;"></div><div class="card-back"></div><div class="card-back"></div>');
});

