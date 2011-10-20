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
  var tpStart = new TemperaturPoint("T", 0, null); // Anfang der TemperaturPoint-Liste
  var tpEnd = new TemperaturPoint("T", 24*60, null); // Anfang der TemperaturPoint-Liste
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
   * Ein TP enthält alle Informationen zu einem Eintrag.
   * Er ist als doppelt verkettete Liste aufgebaut, um jederzeit neue Elemente einfügen zu können.
   * Diese Liste hat ein leeres Anfangs- und ein leeres End-Element.
   * Ein TP enthält auch die SVG-Elemente, die damit zusammenhängen:
   * - die Temperatur-Linie 
   * - sofern nicht das erste Element:
   *   - die Zeit-Linie am Beginn der Temperaturlinie
   *   - die Lösch-Kreise
   */
  function TemperaturPoint(iart, time, temp)
  {
    // private member für die Verkettung der Liste
    var prev;
    var next;
    
    // berechnet Temperatur und Zeit aus den Koordinaten
    this.fromKoord = function()
    {
      this.zeit = this.px * px_minutes_per_px; // zeit
      this.temperatur = (this.py - svg_height) / px_per_grad;
    }
    
    // berechnter Koordiaten aus Temperatur und Zeit
    this.toKoord = function()
    {
      this.px = this.zeit / px_minutes_per_px; // zeit
      this.py = svg_height - this.temperatur * px_per_grad; // Temperatur in Px von canvas.height herunter
    }
    
    // public member für die Werte
    // TODO: Monitore, um zeit/px und Temperatur/py synchron zu setzen
    if (iart == "T")
    {
      this.zeit = time;
      this.temperatur = temp;
      this.toKoord();      
    }
    else if (iart == "X")
    {
      this.px = time;
      this.py = temp;
      this.fromKoord();
    }

    // public SVG-Objekte  für die Darstellung
    this.timeLine = null; // SvgLine senkrecht
    this.temperaturLine = null; // SvgLine waagerecht
    this.circleStart = null; // die beiden Murmeln am Anfang und Ende der TimeLine
    this.circleEnd = null;
    
    // Verschiebe den Start des TemperaturPoint an den angegebenen Punkt
    this.shiftStartTo = function(px)
    {
      this.px = px;
      this.fromKoord();
      if (this.temperaturLine)
      {
        this.temperaturLine.setAttribute("x1", this.px);
      }

      if (this.timeLine)
      {
        this.timeLine.setAttribute("x1", this.px);
        this.timeLine.setAttribute("x2", this.px);
      }
    
      if (this.circleStart)    this.circleStart.setAttribute("cx", this.px);
      if (this.circleEnd)      this.circleEnd.setAttribute("cx", this.px);
      if (this.temperaturLine) this.temperaturLine.setAttribute("x1", this.px);
    }
    
    // Setze das Ende des TemperaturPoint neu
	// Das wird anhand des folgenden TP gemacht
    this.adjustEnd = function()
    {
      var nx = this.next.px;
      if (this.temperaturLine) this.temperaturLine.setAttribute("x2", nx);
    }
    
	// Gibt unser Ende in Px zurück
    this.getEndPx = function()
    {
      // Unser Ende ist der Anfang unseres Nachfolgers
      if (this.next)  return this.next.px;
      return 0;
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
    
    // entfernt den TP aus der Liste
    this.removeFromList = function()
    {
      this.prev.next = this.next;
      this.next.prev = this.prev;
      this.next = this.prev = null;
      
      // removing an SVG-Element
      this.timeLine.parentNode.removeChild(this.timeLine);
      this.temperaturLine.parentNode.removeChild(this.temperaturLine);
      this.circleStart.parentNode.removeChild(this.circleStart);
      this.circleEnd.parentNode.removeChild(this.circleEnd);
      // analog replaceChild(new, old);
    }
	
    // bringt ie Kreise wieder nach vorn
    this.bringCirclesToFront = function(svga)
    {
      this.circleStart.parentNode.removeChild(this.circleStart);
      svga.append(this.circleStart);
      this.circleEnd.parentNode.removeChild(this.circleEnd);
      svga.append(this.circleEnd);
    }
    
    // erzeugt die nötigen svg-Objekte
    this.makeSvg = function()
    {
      // px und py markieren den Anfang unserer TemperaturLinie und das Ende unserer Zeitlinie
      // nx markiert das Ende unserer TemperaturLinie
      var nx = this.getEndPx();
        
      // 1. Waagerecht - die Temperatur-Linie
      this.temperaturLine = mwLine(this.px, this.py, nx-this.px, "rgb(0,200,0)", 5);
      this.temperaturLine.ref = this;
      
      // Brauchen wir auch die ZeitLinie?
      if (this.prev.prev)
      {
        // ny markiert den Anfang unserer Zeitlinie
        var ny = this.prev.py;
		
        // 1. Senkrecht - die Zeit-Linie
        this.timeLine = msLine(this.px, this.py, ny-this.py, "rgb(0,200,0)", 5);
        this.timeLine.ref = this;

        this.circleStart = mCircle(this.px, this.py, 6, "rgb(0,0,200)"); 
        this.circleStart.ref = this;

        this.circleEnd = mCircle(this.px, ny, 6, "rgb(0,0,200)"); 
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
    var xxx = $(cl).offset();
    xxx.left = e.pageX - col;
    kx.html(xxx.left);
    ky.html(xxx.top);
    var ctp = cl.ref;
    var ntp = new TemperaturPoint("X", xxx.left, ctp.py);
    
    // Verketten
    ntp.insertAfter(ctp);
    
    // die alte Linie verkürzen
    ctp.adjustEnd();
    
      // svg erstellen
    ntp.makeSvg();
    
    // Anzeigen
    //svga.append(ntp.temperaturLine);
    svga.append(ntp.temperaturLine);
    ntp.next.bringCirclesToFront(svga);
    $(ntp.temperaturLine).bind("mousedown", startDragTemp);
    $(ntp.temperaturLine).bind("dblclick", splitLine);
    svga.append(ntp.timeLine); 
    $(ntp.timeLine).bind("mousedown", startDragTime);
    svga.append(ntp.circleStart);
    $(ntp.circleStart).bind("dblclick", deleteLeft);
    svga.append(ntp.circleEnd);
    $(ntp.circleEnd).bind("dblclick", deleteRight);
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe links der Zeit
  function deleteLeft(e)
  {
    alert("deleteLeft");
    var cl = e.currentTarget;
    var tp = cl.ref;
    var prev = tp.prev;
    tp.removeFromList();
    prev.adjustEnd();
    prev.next.bringCirclesToFront(svga);
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe rechts der Zeit
  function deleteRight(e)
  {
    alert("deleteRight");
    var cl = e.currentTarget;
    var tp = cl.ref;
    tp.removeFromList();
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
      xxx.top = svg_height;
    }
    
    var tp = currentLine.ref;
    var delta = tp.py - xxx.top;
    
    tp.py = xxx.top;
    tp.fromKoord();

    currentLine.setAttribute("y2", tp.py);
    currentLine.setAttribute("y1", tp.py);
    
    if (tp.timeLine) 
    {
      tp.circleStart.setAttribute("cy", tp.py);
      tp.timeLine.setAttribute("y1", tp.py);
    }
    if (tp.next)
    {
      var e = tp.next;
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
      xxx.left = svg_width;
    }
    
    var tp = currentLine.ref;
    
    // Der Anfang darf nicht vor den Anfang des Vorgängers gelangen
    if (xxx.left <= tp.prev.px + px_min_minutes) xxx.left = tp.prev.px + px_min_minutes;
    
    // Es darf auch nicht zu nahe an das Ende des nächsten TP kommen
    var t = tp.getEndPx();
    if (xxx.left >= t - px_min_minutes) xxx.left = t - px_min_minutes;

    // den Nachfolger über seine neue Startposition informieren
    tp.shiftStartTo(xxx.left);
    
    // SVG-Elemente nachziehen
    tp.prev.adjustEnd();
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
      var neu = new TemperaturPoint("T", va[idx].ts, va[idx].temp);
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
