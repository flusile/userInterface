"use strict";

var kx;
var ky;
var help;
var hulpe;

/**
 * Klasse TemperaturPoint
 */
function TemperaturPoint()
{
  // private member für die Verkettung der Liste
  var prev;
  var next;
  
  // public member für die Werte
  this.zeit = 0;
  this.temperatur = 0;
  
  // public member für die Darstellung
  this.timeLine = null; // SvgLine senkrecht
  this.temperaturLine = null; // SvgLine waagerecht
  this.circleStart = null; // die beiden Murmeln am Anfang und Ende der TemperaturLinie
  this.circleEnd = null;
}

/**
 * Klasse Diagramm.
 * Beinhaltet alle Funktionen und Daten für ein einzelnes Diagramm.
 */
function Diagramm(id_)
{
  var id=id_; // die ID des Root-Elementes, in dem alles enthalten ist
  var currentLine; // aktuelles Linien-Objekt für die eventHandler
  var col; // adjustments für links
  var cot; // und oben.
  var svga = $("#" + id);; // die svg-area, auf der wir malen
  var svg_width = 24*30; // die Breite des Diagramms
  var svg_height = 300;  // die Höhe des Diagramms
  var slot_size = 5; // Nindestzeit in Pixeln
  var tpListe;

  // private Function for writing a line
  function addTempLine(tp, x, y, len)
  {
    var tl = mwLine(x, y, len, "rgb(0,200,0)", 5);
    tl.ref = tp;
    $(tl).bind("mousedown", startDragTemp);
    //svga.append(tl);
    tp.temperaturLine = tl;
  }

  function addTimeLine(tp, x, y, len)
  {
    if (tp.next)
    {
      tp.timeLine = msLine(x, y, len, "rgb(0,200,0)", 5);
      tp.timeLine.ref = tp;
      $(tp.timeLine).bind("mousedown", startDragTime);
      //svga.append(tp.timeLine);
      tp.circleStart = mCircle(x, y, 6, "rgb(0,0,200)"); 
      tp.circleStart.ref = tp;
      //svga.append(tp.c1);
      tp.circleEnd = mCircle( x, y+len, 6, "rgb(0,0,200)"); 
      tp.circleEnd.ref = tp;
      //svga.append(tp.c2);
    }
  }
  
  // justiert den Offset der Zeichenfläche auf ganze Pixel und speichert die Werte für die spätere Verwendung
  function adjustOffset()
  {
    // Wir müssen den offset glattziehen. Er ist initial sehr krumm.
    var xxx     = svga.offset();
    col         = Math.ceil(xxx.left);
    cot         = Math.ceil(xxx.top);
    xxx.left=col;
    xxx.top=cot;
    svga.offset(xxx);
  }
  
  // private eventhandler
  // wird als mousover aufgerufen beim Ziehen der Temperatur-Linie
  function doDragTemp(e)
  {
    var xxx = $(currentLine).offset();
    //xxx.left = e.pageX - col;
    xxx.top = e.pageY - cot;
    kx.html(xxx.left);
    ky.html(xxx.top);
    
    // aus dem Digramm raus soll es nicht laufen
    if (xxx.top > svg_height)
    {
      return;
    }
    
    var delta = currentLine.getAttribute("y1") - xxx.top;
    
    currentLine.setAttribute("y2", xxx.top);
    currentLine.setAttribute("y1", xxx.top);
    var tp = currentLine.ref;
    tp.temperatur = (xxx.top + svg_height) / 5;
    if (tp.circleStart) tp.circleStart.setAttribute("cy", xxx.top);
    if (tp.timeLine) 
    {
      tp.timeLine.setAttribute("y1", tp.timeLine.getAttribute("y1")*1 - delta);
    }
    if (tp.prev)
    {
      var e = tp.prev;
      if (e.timeLine)  e.timeLine.setAttribute("y2", e.timeLine.getAttribute("y2")*1 - delta);
      if (e.circleEnd) e.circleEnd.setAttribute("cy", xxx.top);
    }
  }

  // private eventhandler
  // mousedown - leitet die Verschiebung ein
  function startDragTemp(e)
  {
    currentLine = e.currentTarget;
    $(svga).bind("mousemove", doDragTemp);
    help.html("start dragging temp");
  }

  // private eventhandler
  // wird als mousover aufgerufen beim Ziehen der Zeit-Linie
  function doDragTime(e)
  {
    var xxx = $(currentLine).offset();
    xxx.left = e.pageX - col;
    //xxx.top = e.pageY - cot;
    kx.html(xxx.left);
    ky.html(xxx.top);
    
    // aus dem Digramm raus soll es nicht laufen
    if (xxx.left > svg_width)
    {
      return;
    }
    
    var tp = currentLine.ref;
    if (tp.prev)
    {
      var t = parseInt(tp.prev.timeLine.getAttribute("x1"), 10);
      if (xxx.left <= t + slot_size) return;
    }
    else
    {
      // Ziel ist, daß mindestens ein Slot am Beginn stehen bleibt
      if (xxx.left <= slot_size) return;
    }
    
    if (tp.next.timeLine)
    {
      var t = parseInt(tp.next.timeLine.getAttribute("x1"), 10);
      if (xxx.left >= t - slot_size) return;
    }
    else
    {
      if (xxx.left >= svg_width - slot_size) return;
    }
    
    var delta = currentLine.getAttribute("x1") - xxx.left;
    
    currentLine.setAttribute("x2", xxx.left);
    currentLine.setAttribute("x1", xxx.left);
    tp.zeit = xxx.left;
    if (tp.circleStart)         tp.circleStart.setAttribute("cx", xxx.left);
    if (tp.circleEnd)           tp.circleEnd.setAttribute("cx", xxx.left);
    if (tp.timeLine)            tp.temperaturLine.setAttribute("x2", parseInt(tp.temperaturLine.getAttribute("x2"), 10) - delta);
    if (tp.next.temperaturLine) tp.next.temperaturLine.setAttribute("x1", parseInt(tp.next.temperaturLine.getAttribute("x1"), 10) - delta);
  }

  // private eventhandler
  // mousedown - leitet die Verschiebung ein
  function startDragTime(e)
  {
    currentLine = e.currentTarget;
    $(svga).bind("mousemove", doDragTime);
    help.html("start dragging time");
  }

  // private eventhandler
  // mousup - beendet das Verschieben der Linie
  function stoppDrag(e)
  {
    $(svga).unbind("mousemove");
    currentLine = null;
    help.html("end dragging at");
  }

  // private function to build the internal list
  function build_liste()
  {
    // Entlang des vectors die Linien zeichnen.
    var tp = tpListe; // erstes Element holen
    for (tp = tpListe; tp != null; tp = tp.next)
    {
      var x=tp.zeit / 2; // zeit
      var y=svg_height - tp.temperatur * 5; // Temperatur in Px von canvas.height herunter
      var nx=svg_width;
      var ny;
      if (tp.next)
      {
        nx = tp.next.zeit / 2; // zeit
        ny = svg_height - tp.next.temperatur * 5; // Temperatur in Px von canvas.height herunter
      }
      
      // 1. Waagerecht - die Temperatur-Linie
      addTempLine(tp, x, y, nx-x);

      // 1. Senkrecht - die Zeit-Linie
      addTimeLine(tp, nx, y, ny-y); 
    }
  }

  // public function zum Setzen der Daten
  this.setData = function(data) 
  {
    // zuerst das Ganze parsen
    var va = jQuery.parseJSON(data);
    
    // dann daraus die verkettete Liste aufbauen
    var idx;
    var root = new TemperaturPoint(); // leeres Element als Anfang
    var curr = root;
    for (idx in va)
    {
      var neu = new TemperaturPoint();
      neu.zeit = va[idx].ts;
      neu.temperatur = va[idx].temp;
      curr.next = neu;
      neu.prev = curr;
      curr = neu;
    }
    
    // als Wurzel dient dann das erste erzeugte Element
    tpListe = root.next;
    // Und das hat dann auch keinen Vorgänger mehr
    tpListe.prev = null;
    
    build_liste();
  }
  
  // public function zum Zeichnen des Diagramms
  this.draw = function()
  {
    // Entlang des vectors die Linien zeichnen.
    var tp = tpListe; // erstes Element holen
    for (tp = tpListe; tp != null; tp = tp.next)
    {
      if (tp.temperaturLine) svga.append(tp.temperaturLine);
      if (tp.timeLine)       svga.append(tp.timeLine);
    }
    for (tp = tpListe; tp != null; tp = tp.next)
    {
      if (tp.circleStart) svga.append(tp.circleStart);
      if (tp.circleEnd)   svga.append(tp.circleEnd);
    }
  }

  function init()
  {
    // zuerst die Position korrigieren und speichern
    adjustOffset();

    // MouseButtonUp zentral registrieren
    $(svga).bind("mouseup", stoppDrag);

    // Hintergrund malen
    // TODO: Der Hintergrund hat jetzt keinen Platz für Beschriftung!!!
    svga.append(mRect(0, 0, svg_width, svg_height, "rgb(200,200,200)"));

    // 1000/24 == 41,666
    // Koordinatensystem zeichnen
    svga.append(mwLine(0, svg_height, svg_width, "rgb(200,0,0)", 3));
    svga.append(msLine(0, 0, svg_height, "rgb(200,0,0)", 3));
  }
  
  init();
}

$(function()
{
  kx          = $("#x");
  ky          = $("#y");
  help        = $("#mud");
  hulpe       = $("#hilfe");
  
  kx.html(77);
  ky.html(88);
  help.html("dunno");

  var dia = new Diagramm("svg");

  dia.setData('[{"ts":0,"temp":10},{"ts":600,"temp":30},{"ts":820,"temp":35},{"ts":1320,"temp":20}]');
  
  dia.draw();
})


