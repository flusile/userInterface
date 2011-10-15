
function mLine(id, x1, y1, x2, y2, stroke, strokewidth)
{
  var obj = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  obj.setAttribute("id",           id); 
  obj.setAttribute("stroke",       stroke);
  obj.setAttribute("stroke-width", strokewidth);
  obj.setAttribute("x1",           x1);
  obj.setAttribute("y1",           y1);
  obj.setAttribute("x2",           x2);
  obj.setAttribute("y2",           y2);
  return obj;
}

function msLine(id, x, y, len, stroke, strokewidth)
{
  return mLine(id, x, y, x, y+len, stroke, strokewidth);
}

function mwLine(id, x, y, len, stroke, strokewidth)
{
  return mLine(id, x, y, x+len, y, stroke, strokewidth);
}

function mTempLine(id, x, y, len)
{
  return mwLine(id, x, y, len, "rgb(0,200,0)", 3);
}

function mRect(id, x, y, xlen, ylen, colour)
{
  var obj = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  obj.setAttribute("id",           id); 
  obj.setAttribute("stroke",       colour);
  obj.setAttribute("fill",         colour);
  obj.setAttribute("x",            x);
  obj.setAttribute("y",            y);
  obj.setAttribute("width",        xlen);
  obj.setAttribute("height",       ylen);
  return obj;
}


function mSquare(id, x, y, len, colour)
{
  return mRect(id, x, y, len, len, colour);
}

function mCircle(id, x, y, radius, colour)
{
  var obj = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  obj.setAttribute("id",           id); 
  obj.setAttribute("stroke",       colour);
  obj.setAttribute("fill",         colour);
  obj.setAttribute("cx",           x);
  obj.setAttribute("cy",           y);
  obj.setAttribute("r",            radius);
  return obj;
}

function addTempLine(svg, id, x, y, len)
{
  svg.append(mwLine("templine_" + id, x, y, len, "rgb(0,200,0)", 3));
  svg.append(mCircle("temp_pt_" + id, x, y, 6, "rgb(0,0,200)"));
}

function addTimeLine(svg, id, x, y, len)
{
  svg.append(msLine("timeline_" + id, x, y, len, "rgb(0,200,0)", 3));
}


$(function()
{
  var kx      = $("#x");
  var ky      = $("#y");
  var mud     = $("#mud");
  var redline = $("#redline");
  var bluline = $("#blueline");
  var active  = false;
  var svga    = $("#svg");

  // zwei Konstanten für die Abmessungen des Diagramms
  var svg_width = 24*30;
  var svg_height = 300;
  
  // Wir müssen den offset glattziehen. Er ist initial sehr krumm.
  var xxx     = svga.offset();
  var col     = Math.ceil(xxx.left);
  var cot     = Math.ceil(xxx.top);
  xxx.left=col;
  xxx.top=cot;
  svga.offset(xxx);
  
  // TODO: Das sind Beispieldaten. Die müssen später vom Server kommen
  var data = '[{"ts":0,"temp":10},{"ts":600,"temp":30},{"ts":1320,"temp":20}]';
  
  // Daten parsen
  var va = jQuery.parseJSON(data);
  
  // Hintergrund malen
  // TODO: Der Hintergrund hat jetzt keinen Platz für Beschriftung!!!
  svga.append(mRect("ground", 0, 0, svg_width, svg_height, "rgb(200,200,200)"));

  // 1000/24 == 41,666
  // Koordinatensystem zeichnen
  svga.append(mwLine("koord_h", 0, svg_height, svg_width, "rgb(200,0,0)", 3));
  svga.append(msLine("koord_v", 0, 0, svg_height, "rgb(200,0,0)", 3));

  // Entlang des vectors die Linien zeichnen.
  var x=0; // zeit
  var y=0; // Temperatur in Px von canvas.height herunter
  for (idx in va)
  {
    var e = va[idx]
    var str = e.ts + " " + e.temp;
    $("#hilfe").html(str);
    var nx=e.ts/2;	
    var ny=svg_height - e.temp*5;
    if (nx != 0)
    {
      // 1. Waagerecht - die Temperatur-Linie
      addTempLine(svga, idx-1, x, y, nx-x);
      
      // 1. Senkrecht - die Zeit-Linie
      addTimeLine(svga, idx-1, nx, y, ny-y); 
    }

    x=nx;
    y=ny;
  }
  
  // zum schluss die letzte waagerechte Temperatur-Linie
  addTempLine(svga, idx, x, y, svg_width-x);
  
/*
  redline.mousemove(function(e)
  {
    var x = e.pageX - col;
    var y = e.pageY - cot;
    kx.html(x);
    ky.html(y);
    mud.html("redline");
  });
  
  bluline.mousemove(function(e)
  {
    var x = e.pageX - col;
    var y = e.pageY - cot;
    kx.html(x);
    ky.html(y);
    mud.html("blue line");
  });
  
  //$("#hilfe").html(str);
  canvas.mousemove(function(e)
  { // früher: clientX/Y
    var x = e.pageX - col;
    var y = e.pageY - cot;
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
  */
  kx.html(77);
  ky.html(88);
  mud.html("dunno");
})


