// ════════════════════════════════════════════════════════════
// js/core/watercolor-bg.js
// Fitur: Watercolor Canvas Animation (background dekoratif)
// Depends on: elemen <canvas id="wc"> di index.html. Tidak depend ke file JS lain.
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// WATERCOLOR CANVAS ANIMATION
// ════════════════════════════════════════════════════════════
(function(){
  var c=document.getElementById('wc'),ctx=c.getContext('2d');
  var W,H,drops=[],waves=[],pts=[];
  var COLS=['rgba(124,58,237,','rgba(219,39,119,','rgba(8,145,178,','rgba(217,119,6,','rgba(5,150,105,','rgba(167,139,250,'];

  function resize(){
    W=c.width=window.innerWidth;
    H=c.height=window.innerHeight;
    initWaves();
  }
  function initWaves(){
    waves=[];
    for(var i=0;i<6;i++){
      waves.push({y:H*(0.1+i*0.14),amp:18+Math.random()*38,
        wl:160+Math.random()*300,spd:0.00015+Math.random()*0.00025,
        ph:Math.random()*Math.PI*2,col:COLS[i%6],
        a:0.06+Math.random()*0.09,lw:0.8+Math.random()*1.4});
    }
  }
  function mkPt(){
    pts.push({x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,
      r:.6+Math.random()*2.2,col:COLS[Math.floor(Math.random()*6)],
      a:.12+Math.random()*0.3,life:1,dec:.0004+Math.random()*.0008});
  }
  for(var i=0;i<55;i++)mkPt();

  function addDrop(x,y){
    drops.push({x:x||Math.random()*W,y:y||Math.random()*H,
      r:0,max:22+Math.random()*55,
      col:COLS[Math.floor(Math.random()*6)],
      a:.4+Math.random()*.3});
  }
  setInterval(function(){addDrop();},2600);

  document.addEventListener('click',function(e){
    for(var i=0;i<3;i++)
      drops.push({x:e.clientX+(Math.random()-0.5)*30,
        y:e.clientY+(Math.random()-0.5)*30,
        r:0,max:12+Math.random()*30,
        col:COLS[Math.floor(Math.random()*6)],
        a:.5+Math.random()*.3});
  });

  var lt=0;
  function draw(t){
    var dt=t-lt;lt=t;
    ctx.clearRect(0,0,W,H);

    // Background gradient
    var g=ctx.createRadialGradient(W*.45,H*.35,0,W*.5,H*.5,W*.9);
    g.addColorStop(0,'#1e0d35');
    g.addColorStop(.55,'#130820');
    g.addColorStop(1,'#0a0315');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    // Soft purple glow center
    var gl=ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.4,W*.55);
    gl.addColorStop(0,'rgba(124,58,237,0.14)');
    gl.addColorStop(.4,'rgba(219,39,119,0.08)');
    gl.addColorStop(1,'transparent');
    ctx.fillStyle=gl;ctx.fillRect(0,0,W,H);

    // Paint waves
    for(var i=0;i<waves.length;i++){
      var w=waves[i];
      w.ph+=w.spd*dt;
      ctx.beginPath();ctx.moveTo(0,w.y);
      for(var x=0;x<=W;x+=3)
        ctx.lineTo(x,w.y+Math.sin(x/w.wl*Math.PI*2+w.ph)*w.amp);
      ctx.strokeStyle=w.col+w.a+')';ctx.lineWidth=w.lw;ctx.stroke();
    }

    // Ink drop ripples
    for(var i=drops.length-1;i>=0;i--){
      var d=drops[i];d.r+=0.75;
      var life=1-d.r/d.max;
      if(life<=0){drops.splice(i,1);continue;}
      ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.strokeStyle=d.col+(d.a*life)+')';
      ctx.lineWidth=1.8*(1-d.r/d.max);ctx.stroke();
    }

    // Particle connections
    for(var i=0;i<pts.length;i++){
      for(var j=i+1;j<pts.length;j++){
        var dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;
        var dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<110){
          ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle='rgba(167,139,250,'+(0.07*(1-dist/110))+')';
          ctx.lineWidth=.6;ctx.stroke();
        }
      }
      // Particles
      var p=pts[i];
      p.x+=p.vx;p.y+=p.vy;p.life-=p.dec;
      if(p.x<-5)p.x=W+5;if(p.x>W+5)p.x=-5;
      if(p.y<-5)p.y=H+5;if(p.y>H+5)p.y=-5;
      if(p.life<=0){pts.splice(i,1);mkPt();i--;continue;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.col+(p.a*p.life)+')';ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);
  resize();requestAnimationFrame(draw);
})();
