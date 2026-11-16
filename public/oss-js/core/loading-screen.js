// LOADING SCREEN DISMISS
(function(){
  var ls = document.getElementById('loading-screen');
  var bar = document.getElementById('load-bar');
  var pct = document.getElementById('load-percent');
  var DURATION = 3500; // smooth continuous progress: 1 → 100 over ~3.5s, no jumps
  var start = null;
  var lastShown = 0;

  function tick(ts){
    if(start === null) start = ts;
    var elapsed = ts - start;
    var raw = (elapsed / DURATION) * 100;
    var current = Math.min(100, Math.max(1, Math.floor(raw)));
    if(current !== lastShown){
      lastShown = current;
      bar.style.width = current + '%';
      pct.textContent = current + '%';
    }
    if(elapsed < DURATION){
      requestAnimationFrame(tick);
    } else {
      bar.style.width = '100%';
      pct.textContent = '100%';
      setTimeout(function(){
        ls.classList.add('hidden');
        setTimeout(function(){ ls.style.display='none'; }, 650);
      }, 280);
    }
  }
  requestAnimationFrame(tick);
})();

