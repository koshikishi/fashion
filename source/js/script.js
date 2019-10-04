'use strict';

var modal = document.querySelector('.modal');
var modalClose = modal.querySelector('.modal__close');
var isModalShown = false;

window.addEventListener('scroll', function () {
  if (!isModalShown) {
    isModalShown = true;
    modal.classList.add('modal--show');
  }
});

modalClose.addEventListener('click', function (evt) {
  evt.preventDefault();
  modal.classList.remove('modal--show');
});

window.addEventListener('keydown', function (evt) {
  if (evt.keyCode === 27) {
    evt.preventDefault();

    if (modal.classList.contains('modal--show')) {
      modal.classList.remove('modal--show');
    }
  }
});
