/* Header behaviour for pages using the shared shell upgrade. */
(function () {
  'use strict';
  var header = document.getElementById('site-header');
  var bar = document.createElement('div');
  bar.className = 'shell-progress';
  document.body.appendChild(bar);

  function update() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();
