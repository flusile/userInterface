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
  // die folgenden Felder enthalten das Adjustment der SVG-Area im Dokument
  var begin_svga_x; // adjustments für links
  var begin_svga_y; // und oben.
  // Offsets für das Diagramm im SVGA-Bereich (für die Beschreiftung)
  var offset_dia_x = 30;
  var offset_dia_y = 30;
  // die folgenden Felder enthalten das Adjustment des Diagrammbereichs in Bezug
  // auf das Dokument
  var begin_diagram_x;
  var begin_diagram_y;
  var diagramm_width = 24*30; // die Breite des Diagramms
  var diagramm_height = 300;  // die Höhe des Diagramms
  var svg_width = diagramm_width + offset_dia_x; // die Breite des Diagramms
  var svg_height = diagramm_height + offset_dia_y;  // die Höhe des Diagramms
  
  var svga = $("#" + id); // die svg-area, auf der wir malen
  svga.attr("width", svg_width);
  svga.attr("height", svg_height);
  
  var tpStart = new TemperaturPoint("T", 0, null); // Anfang der TemperaturPoint-Liste
  var tpEnd = new TemperaturPoint("T", 24*60, null); // Anfang der TemperaturPoint-Liste
  // Sie bilden den Rumpf der Liste
  tpStart.next = tpEnd;
  tpEnd.prev = tpStart;
  
  // diverse Konstanten
  var px_min_minutes = 10; // Nindestzeit in Pixeln
  var px_minutes_per_px = 10; // nur alle 2 Minuten ein Pixel (sonst wirds zu breit)
  var px_per_grad = 1; // 5 Pixel pro °C
  var px_zeit_0000 = 0; // Pixelposition für 00:00 Uhr
  var px_zeit_2400 = px_zeit_0000 + (24*60 / px_minutes_per_px); // Pixelpos für 24:00
  var px_temperatur_min = svg_height; // Pixelpos für minimale Temperatur
  var px_temperatur_max = 0; // Pixelpos für maximale Temperatur

  /**
   * Klasse Koord
   * Dient zum Umrechnen von fachlichen Koordinaten (hier: Zeit und Temperatur)
   * in Pixel-Koordinaten für die svg-Area
   * und zurück.
   */
   function Koord(typ, kx, ky)
   {
      var px, py, fx, fy;
      
      this.getPx = function() { return px; }
      this.getPy = function() { return py; }
      this.getZeit = function() { return fx; }
      this.getTemperatur = function() { return fy; }
//      hulpe.html("Zeit = " + this.zeit + ", Temp. = " + this.temperatur);
      
      this.setPx = function(kx)
      {
        px = kx;
        fx = px * px_minutes_per_px; // zeit
      }
      
      this.setPy = function(ky)
      {
        py = ky;
        fy = (svg_height - py) / px_per_grad;
      }
      
      this.setZeit = function(kx)
      {
        fx = kx;
        px = fx / px_minutes_per_px; // zeit
      }
      
      this.setTemperatur = function(ky)
      {
        fy = ky;
        py = svg_height - fy * px_per_grad; // Temperatur in Px von canvas.height herunter
      }

      if (typ == "X")
      {
         this.setPx(kx);
         this.setPy(ky);
      }
      else
      {
        this.setZeit(kx);
        this.setTemperatur(ky);
      }
    }
   
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
  function TemperaturPoint(typ, kx, ky)
  {
    // private member für die Verkettung der Liste
    var prev;
    var next;
    this.origin = new Koord(typ, kx, ky);
    
    // public SVG-Objekte  für die Darstellung
    this.timeLine = null; // SvgLine senkrecht
    this.temperaturLine = null; // SvgLine waagerecht
    this.circleStart = null; // die beiden Murmeln am Anfang und Ende der TimeLine
    this.circleEnd = null;
    
    // Verschiebe den Start des TemperaturPoint an den angegebenen Punkt
    this.shiftStartTo = function(px)
    {
      this.origin.setPx(px);
      if (this.temperaturLine)
      {
        this.temperaturLine.setAttribute("x1", this.origin.getPx());
      }

      if (this.timeLine)
      {
        this.timeLine.setAttribute("x1", this.origin.getPx());
        this.timeLine.setAttribute("x2", this.origin.getPx());
      }
    
      if (this.circleStart)    this.circleStart.setAttribute("cx", this.origin.getPx());
      if (this.circleEnd)      this.circleEnd.setAttribute("cx", this.origin.getPx());
      if (this.temperaturLine) this.temperaturLine.setAttribute("x1", this.origin.getPx());
    }
    
    // Setze das Ende des TemperaturPoint neu
    // Das wird anhand des folgenden TP gemacht
    this.adjustEnd = function()
    {
      var nx = this.next.origin.getPx();
      if (this.temperaturLine) this.temperaturLine.setAttribute("x2", nx);
    }
    
    function killSvg(svgo)
    {
      svgo.parentNode.removeChild(svgo);
    }
    
    this.adjustTime = function()
    {
      var ny = this.prev.origin.getPy();
      if (this.prev.prev == null)
      {
        // Wir sind jetzt das neue erste Element!!!
        killSvg(this.timeLine); this.timeLine = null;
        killSvg(this.circleStart); this.circleStart = null;
        killSvg(this.circleEnd); this.circleEnd = null;
      }
      else
      {
        if (this.timeLine) this.timeLine.setAttribute("y2", ny);
        if (this.circleEnd) this.circleEnd.setAttribute("cy", ny);
      }
    }

    // Gibt unser Ende in Px zurück
    this.getEndPx = function()
    {
      // Unser Ende ist der Anfang unseres Nachfolgers
      if (this.next)  return this.next.origin.getPx();
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
      killSvg(this.temperaturLine); this.temperaturLine = null;
      if (this.timeLine)
      {
        killSvg(this.timeLine); this.timeLine = null;
        killSvg(this.circleStart); this.circleStart = null;
        killSvg(this.circleEnd); this.circleEnd = null;
      }
      // analog replaceChild(new, old);
    }
	
    // bringt ie Kreise wieder nach vorn
    this.bringCirclesToFront = function(svga)
    {
      if (this.circleStart)
      {
        this.circleStart.parentNode.removeChild(this.circleStart);
        svga.append(this.circleStart);
      }
      if (this.circleEnd)
      {
        this.circleEnd.parentNode.removeChild(this.circleEnd);
        svga.append(this.circleEnd);
      }
    }
    
    // erzeugt die nötigen svg-Objekte
    this.makeSvg = function()
    {
      // px und py markieren den Anfang unserer TemperaturLinie und das Ende unserer Zeitlinie
      // nx markiert das Ende unserer TemperaturLinie
      var nx = this.getEndPx();
        
      // 1. Waagerecht - die Temperatur-Linie
      this.temperaturLine = mwLine(this.origin.getPx(), this.origin.getPy(), nx-this.origin.getPx(), 
                                   "rgb(0,200,0)", 5);
      this.temperaturLine.ref = this;
      
      // Brauchen wir auch die ZeitLinie?
      if (this.prev.prev)
      {
        // ny markiert den Anfang unserer Zeitlinie
        var ny = this.prev.origin.getPy();
		
        // 1. Senkrecht - die Zeit-Linie
        this.timeLine = msLine(this.origin.getPx(), this.origin.getPy(), ny-this.origin.getPy(), "rgb(0,200,0)", 5);
        this.timeLine.ref = this;

        this.circleStart = mCircle(this.origin.getPx(), this.origin.getPy(), 6, "rgb(0,0,200)"); 
        this.circleStart.ref = this;

        this.circleEnd = mCircle(this.origin.getPx(), ny, 6, "rgb(0,0,200)"); 
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
    xxx.left = e.pageX - begin_svga_x;
    kx.html(xxx.left);
    ky.html(xxx.top);
    var ctp = cl.ref;
    var ntp = new TemperaturPoint("X", xxx.left, ctp.origin.getPy());
    
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
    $(ntp.circleStart).bind("dblclick", deleteRight);
    svga.append(ntp.circleEnd);
    $(ntp.circleEnd).bind("dblclick", deleteLeft);
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe links der Zeit
  function deleteLeft(e)
  {
    alert("deleteLeft");
    var cl = e.currentTarget;
    var tp = cl.ref.prev;
    var prv = tp.prev;
    var nxt = tp.next;
    nxt.shiftStartTo(tp.origin.getPx());
    tp.removeFromList();
    nxt.adjustTime();
    nxt.bringCirclesToFront(svga);
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe rechts der Zeit
  function deleteRight(e)
  {
    alert("deleteRight");
    var cl = e.currentTarget;
    var tp = cl.ref;
    var prev = tp.prev;
    tp.removeFromList();
    prev.adjustEnd();
    prev.next.adjustTime();
    prev.next.bringCirclesToFront(svga);
  }
  
  // justiert den Offset der Zeichenfläche auf ganze Pixel und speichert die Werte für die spätere Verwendung
  function adjustOffset()
  {
    // Wir müssen den offset glattziehen. Er ist initial sehr krumm.
    var xxx      = svga.offset();
    begin_svga_x = Math.ceil(xxx.left);
    begin_svga_y = Math.ceil(xxx.top);
    xxx.left=begin_svga_x;
    xxx.top=begin_svga_y;
    svga.offset(xxx);
  }
  
  // private eventhandler
  // wird als mousover aufgerufen beim Ziehen der Temperatur-Linie
  function doDragTemp(e)
  {
    var xxx = $(currentLine).offset();
    xxx.top = e.pageY - begin_svga_y;
    kx.html(xxx.left);
    ky.html(xxx.top);
    
    // aus dem Digramm raus soll es nicht laufen
    if (xxx.top > svg_height)
    {
      xxx.top = svg_height;
    }
    
    var tp = currentLine.ref;
    var delta = tp.origin.getPy() - xxx.top;
    
    tp.origin.setPy(xxx.top);

    currentLine.setAttribute("y2", tp.origin.getPy());
    currentLine.setAttribute("y1", tp.origin.getPy());
    
    if (tp.timeLine) 
    {
      tp.circleStart.setAttribute("cy", tp.origin.getPy());
      tp.timeLine.setAttribute("y1", tp.origin.getPy());
    }
    if (tp.next)
    {
      var e = tp.next;
      if (e.timeLine)  e.timeLine.setAttribute("y2", tp.origin.getPy());
      if (e.circleEnd) e.circleEnd.setAttribute("cy", tp.origin.getPy());
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
    xxx.left = e.pageX - begin_svga_x;
    kx.html(xxx.left);
    ky.html(xxx.top);
    
    // aus dem Digramm raus soll es nicht laufen
    if (xxx.left > svg_width)
    {
      xxx.left = svg_width;
    }
    
    var tp = currentLine.ref;
    
    // Der Anfang darf nicht vor den Anfang des Vorgängers gelangen
    if (xxx.left <= tp.prev.origin.getPx() + px_min_minutes) xxx.left = tp.prev.origin.getPx() + px_min_minutes;
    
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
        $(tp.circleStart).bind("dblclick", deleteRight);
      }
      if (tp.circleEnd)
      {
        svga.append(tp.circleEnd);
        $(tp.circleEnd).bind("dblclick", deleteLeft);
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

  dia.setData('[{"ts":0,"temp":40},{"ts":600,"temp":35},{"ts":820,"temp":30},{"ts":1320,"temp":20}]');
  
  dia.draw();
})
