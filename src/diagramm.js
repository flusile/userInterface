
$(function()
{
  var canvas = $("#diagramm_1");
  var kx     = $("#x");
  var ky     = $("#y");
  var mud    = $("#mud");
  var active = false;
  var xxx    = canvas.offset();
  var col    = Math.ceil(xxx.left);
  var cot    = Math.ceil(xxx.top);
  xxx.left=col;
  xxx.top=cot;
  canvas.offset(xxx);
  
  canvas.attr("width", 24*30); // max. 1000, Tageszeit
  canvas.attr("height", 200); // Temperatur

  var ctx = document.getElementById("diagramm_1").getContext("2d"); 
  
  var data = '[{"ts":0,"temp":10},{"ts":600,"temp":30},{"ts":1320,"temp":20}]';
  
  var va = jQuery.parseJSON(data);

  //$("#hilfe").html(str);
  canvas.mousemove(function(e)
  {
    var x = e.clientX - col;
    var y = e.clientY - cot;
    kx.html(x);
    ky.html(y);
    if (active)
    {
      mud.html("down");
    }
    else
    {
      mud.html("up");
    }
  });
  
  // Prüfen: sind wir auf einer Linie oder auf einem blauen Viereck?
  canvas.mousedown(function()
  {
    active = true; 
  });
  canvas.mouseup(function()
  {
    active = false; 
  });
  
  kx.html(77);
  ky.html(88);
  mud.html("dunno");
  
  // Hintergrund malen
  ctx.fillStyle = "rgb(200,200,200)";  
  ctx.fillRect(0, 0, canvas.attr("width"), canvas.attr("height"));

  // 1000/24 == 41,666
  // Koordinatensystem zeichnen
  ctx.fillStyle = "rgb(200,0,0)";
  ctx.fillRect(0, 199, 24*60, 1);
  ctx.fillRect(0, 0, 1, 200);
  

  var x=0; // zeit
  var y=0; // Temperatur in Px von canvas.height herunter
  for (idx in va)
  {
    var e = va[idx]
    var str = e.ts + " " + e.temp;
    $("#hilfe").html(str);
    var nx=e.ts/2;	
    var ny=canvas.attr("height") - e.temp*5;
    if (nx != 0)
    {
      // 1. Waagerecht
      ctx.fillStyle = "rgb(0,200,0)";
      ctx.fillRect(x, y-1, nx-x, 3);

      ctx.fillStyle = "rgb(0,0,200)";
      ctx.fillRect(x-3, y-3, 7, 7);
      
      // Male Linie von x/y nach nx/ny
      // 1. Senkrecht
      ctx.fillStyle = "rgb(0,200,0)";
      ctx.fillRect(nx-1, y, 3, ny-y);    
    }

    x=nx;
    y=ny;
  }
  
  // zum schluss die letzte waagerechte
  nx=canvas.attr("width");
  ctx.fillStyle = "rgb(0,200,0)";
  ctx.fillRect(x, y-1, nx-x, 3);

  ctx.fillStyle = "rgb(0,0,200)";
  ctx.fillRect(x-3, y-3, 7, 7);
})


