"use strict";

var kx;
var ky;
var help;
var hulpe;

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
  var svga = $("#" + id); // die svg-area, auf der wir malen
  var svg_width = 24*30; // die Breite des Diagramms
  var svg_height = 300;  // die Höhe des Diagramms
  var px_min_minutes = 5; // Nindestzeit in Pixeln
  var tpStart = new TemperaturPoint(); // Anfang der TemperaturPoint-Liste
  var tpEnd = new TemperaturPoint(); // Anfang der TemperaturPoint-Liste
  // Sie bilden den Rumpf der Liste
  tpStart.next = tpEnd;
  tpEnd.prev = tpStart;
  
  // diverse Konstanten
  var px_minutes_per_px = 2; // nur alle 2 Minuten ein Pixel (sonst wirds zu breit)
  var px_per_grad = 5; // 5 Pixel pro °C
  var px_zeit_0000 = 0; // Pixelposition für 00:00 Uhr
  var px_zeit_2400 = px_zeit_0000 + (24*60 / px_minutes_per_px); // Pixelpos für 24:00
  var px_temperatur_min = svg_height; // Pixelpos für minimale Temperatur
  var px_temperatur_max = 0; // Pixelpos für maximale Temperatur

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
    
    // fügt diesen TP hinter tp ein
    this.insertAfter = function(tp)
    {
      this.next = tp.next;
      tp.next = this;
      this.prev = tp;
      this.next.prev = this;
    }
    
    // fügt diesen TP vor tp ein
    this.insertBefore = function(tp)
    {
      this.insertAfter(tp.prev);
    }
    
    // erzeugt die nötigen svg-Objekte
    this.makeSvg = function()
    {
      var x = this.zeit / px_minutes_per_px; // zeit
      var y = svg_height - this.temperatur * px_per_grad; // Temperatur in Px von canvas.height herunter
      var nx = svg_width;
      var ny;
      if (this.next)
      {
        nx = this.next.zeit / px_minutes_per_px; // zeit
        ny = svg_height - this.next.temperatur * px_per_grad; // Temperatur in Px von canvas.height herunter
      }
        
      // 1. Waagerecht - die Temperatur-Linie
      this.temperaturLine = mwLine(x, y, nx-x, "rgb(0,200,0)", 5);
      this.temperaturLine.ref = this;
      
      if (this.next)
      {
        // 1. Senkrecht - die Zeit-Linie
        this.timeLine = msLine(nx, y, ny-y, "rgb(0,200,0)", 5);
        this.timeLine.ref = this;

        this.circleStart = mCircle(nx, y, 6, "rgb(0,0,200)"); 
        this.circleStart.ref = this;

        this.circleEnd = mCircle(nx, ny, 6, "rgb(0,0,200)"); 
        this.circleEnd.ref = this;
      }
    }
  }

  // private eventhandler
  // splittet eine Temperaturzeile
  function splitLine(e)
  {
    alert("split line");
    var cl = e.currentTarget;
    var ctp = cl.ref;
    var ntp = new TemperaturPoint();
    
    // Werte setzen
    ntp.temperatur = ctp.temperatur;
    ntp.zeit = (e.pageX - col) * px_minutes_per_px;
    
    // Verketten
    
    // zeiten anpassen
    //ntp.prev.zeit -= px_min_minutes;
    
    // neue Objekte erzeugen
    
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe links der Zeit
  function deleteLeft(e)
  {
    alert("deleteLeft");
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe rechts der Zeit
  function deleteRight(e)
  {
    alert("deleteRight");
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
    tp.temperatur = (xxx.top + svg_height) / px_per_grad;
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
      if (xxx.left <= t + px_min_minutes) return;
    }
    else
    {
      // Ziel ist, daß mindestens ein Slot am Beginn stehen bleibt
      if (xxx.left <= px_min_minutes) return;
    }
    
    if (tp.next.timeLine)
    {
      var t = parseInt(tp.next.timeLine.getAttribute("x1"), 10);
      if (xxx.left >= t - px_min_minutes) return;
    }
    else
    {
      if (xxx.left >= svg_width - px_min_minutes) return;
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
    var tp; // erstes Element holen
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      tp.makeSvg();
    }
  }

  // public function zum Setzen der Daten
  this.setData = function(data) 
  {
    // zuerst das Ganze parsen
    var va = jQuery.parseJSON(data);
    
    // dann daraus die verkettete Liste aufbauen
    var idx;
    for (idx in va)
    {
      var neu = new TemperaturPoint();
      neu.zeit = va[idx].ts;
      neu.temperatur = va[idx].temp;

      neu.insertBefore(tpEnd);
    }
    
    build_liste();
  }
  
  // public function zum Zeichnen des Diagramms
  this.draw = function()
  {
    // Entlang des vectors die Linien zeichnen.
    var tp; // erstes Element holen
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      if (tp.temperaturLine)
      {
        svga.append(tp.temperaturLine);
        $(tp.temperaturLine).bind("mousedown", startDragTemp);
        $(tp.temperaturLine).bind("dblclick", splitLine);
      }
      if (tp.timeLine)
      {
        svga.append(tp.timeLine);
        $(tp.timeLine).bind("mousedown", startDragTime);
      }
    }
    for (tp = tpListe; tp != null; tp = tp.next)
    {
      if (tp.circleStart)
      {
        svga.append(tp.circleStart);
        $(tp.circleStart).bind("dblclick", deleteLeft);
      }
      if (tp.circleEnd)
      {
        svga.append(tp.circleEnd);
        $(tp.circleEnd).bind("dblclick", deleteRight);
      }
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


