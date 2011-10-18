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
  var tpStart = new TemperaturPoint(0, null); // Anfang der TemperaturPoint-Liste
  var tpEnd = new TemperaturPoint(24*60, null); // Anfang der TemperaturPoint-Liste
  // Sie bilden den Rumpf der Liste
  tpStart.next = tpEnd;
  tpEnd.prev = tpStart;
  tpEnd.px = svg_width;
  
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
  function TemperaturPoint(time, temp)
  {
    // private member für die Verkettung der Liste
    var prev;
    var next;
    
    // public member für die Werte
    this.zeit = time;
    this.temperatur = temp;
    
    // der Anfang dieses temperaturPoints in Pixeln
    this.px = 0;
    this.py = 0;
    
    // public member für die Darstellung
    this.timeLine = null; // SvgLine senkrecht
    this.temperaturLine = null; // SvgLine waagerecht
    this.circleStart = null; // die beiden Murmeln am Anfang und Ende der TemperaturLinie
    this.circleEnd = null;
    
    // Verschiebe den Start des TemperaturPoint an den angegebenen Punkt
    this.shiftStartTo = function(px)
    {
      this.px = px;
      if (this.temperaturLine)
      {
        this.temperaturLine.setAttribute("x1", this.px);
      }
    }
    
    // Setze das Ende des TemperaturPoint neu
    this.adjustEnd = function()
    {
      var nx = this.next.px;
      this.timeLine.setAttribute("x2", nx);
      this.timeLine.setAttribute("x1", nx);
    
      if (this.circleStart)    this.circleStart.setAttribute("cx", nx);
      if (this.circleEnd)      this.circleEnd.setAttribute("cx", nx);
      if (this.temperaturLine) this.temperaturLine.setAttribute("x2", nx);
    }
    
    this.getEndPx = function()
    {
      return this.next.next.px;
    }
    
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
      this.px = this.zeit / px_minutes_per_px; // zeit
      this.py = svg_height - this.temperatur * px_per_grad; // Temperatur in Px von canvas.height herunter
      var nx = svg_width;
      var ny;
      if (this.next.next)
      {
        nx = this.next.zeit / px_minutes_per_px; // zeit
        ny = svg_height - this.next.temperatur * px_per_grad; // Temperatur in Px von canvas.height herunter
      }
        
      // 1. Waagerecht - die Temperatur-Linie
      this.temperaturLine = mwLine(this.px, this.py, nx-this.px, "rgb(0,200,0)", 5);
      this.temperaturLine.ref = this;
      
      if (this.next.next)
      {
        // 1. Senkrecht - die Zeit-Linie
        this.timeLine = msLine(nx, this.py, ny-this.py, "rgb(0,200,0)", 5);
        this.timeLine.ref = this;

        this.circleStart = mCircle(nx, this.py, 6, "rgb(0,0,200)"); 
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
    var ntp = new TemperaturPoint(ctp.temperatur,
                                  (e.pageX - col) * px_minutes_per_px);
    
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
    
    var tp = currentLine.ref;
    var delta = tp.py - xxx.top;
    
    tp.py = xxx.top;
    currentLine.setAttribute("y2", tp.py);
    currentLine.setAttribute("y1", tp.py);
    tp.temperatur = (tp.py + svg_height) / px_per_grad;
    if (tp.circleStart) tp.circleStart.setAttribute("cy", tp.py);
    if (tp.timeLine) 
    {
      tp.timeLine.setAttribute("y1", tp.py);
    }
    if (tp.prev)
    {
      var e = tp.prev;
      if (e.timeLine)  e.timeLine.setAttribute("y2", tp.py);
      if (e.circleEnd) e.circleEnd.setAttribute("cy", tp.py);
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
    
    // Das Ende darf nicht vor den eigenen Anfang gelangen
    if (xxx.left <= tp.px + px_min_minutes) return;
    
    // Es darf auch nicht zu nahe an das Ende des nächsten TP kommen
    var t = tp.getEndPx();
    if (xxx.left >= t - px_min_minutes) return;

    // den Nachfolger über seine neue Startposition informieren
    tp.next.shiftStartTo(xxx.left);
    
    // SVG-Elemente nachziehen
    tp.adjustEnd();
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
      var neu = new TemperaturPoint(va[idx].ts, va[idx].temp);
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
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
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


