"use strict";

var kx;
var ky;
var help;
var hulpe;

function f0(z)
{
  var s = z.toString();
  if (s.length < 2)
  {
    return "0" + s;
  }
  return s;
}

function TimeString(t)
{
  var h = Math.floor(t / 60);
  var res = f0(h) + ":" + f0(t-h*60);
  return res;
}


/**
 * Klasse Diagramm.
 * Beinhaltet alle Funktionen und Daten für ein einzelnes Diagramm.
 */
function Diagramm(id_)
{
  var id=id_; // die ID des Root-Elementes, in dem alles enthalten ist
  // Beginn des CTor-Codes
  var svga = $("#" + id); // die svg-area, auf der wir malen

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
  
  // fachliche Grenzen für das Diagramm
  var zeit_min = 0; // 00:00 ist der Anfang
  var zeit_max = 24*60; // 24:00 ist das Ende
  var temperatur_min = 0; // kälter als 0°C machen wir es nicht
  var temperatur_max = getAttr("temp_max", 100); // heißer als 100°C machen wir es auch nicht
  
  // Umrechnunskonstanten fachlich <--> Pixel
  var minutes_per_px = 2; // nur alle 2 Minuten ein Pixel (sonst wirds zu breit)
  var px_per_grad = 3; // Pixel pro °C

  // abgeleitete Konstanten für die Diagramm-Abmessungen in px
  var diagramm_width = (zeit_max - zeit_min) / minutes_per_px; // die Breite des Diagramms
  var diagramm_height = (temperatur_max - temperatur_min) * px_per_grad;  // die Höhe des Diagramms
  var svg_width = diagramm_width + offset_dia_x; // die Breite des Diagramms
  var svg_height = diagramm_height + offset_dia_y;  // die Höhe des Diagramms

  var px_zeit_0000 = offset_dia_x; // Pixelposition für 00:00 Uhr
  var px_zeit_2400 = px_zeit_0000 + diagramm_width; // Pixelpos für 24:00
  var px_temperatur_min = svg_height - offset_dia_y; // Pixelpos für minimale Temperatur
  var px_temperatur_max = 0; // Pixelpos für maximale Temperatur
  
  // diverse Konstanten
  var zeit_raster_minuten = 10; // Nindestzeit in Pixeln

  svga.attr("width", svg_width);
  svga.attr("height", svg_height);
  
  var tpStart = new TemperaturPoint("T", zeit_min, null); // Anfang der TemperaturPoint-Liste
  var tpEnd = new TemperaturPoint("T", zeit_max, null); // Anfang der TemperaturPoint-Liste
  // Sie bilden den Rumpf der Liste
  tpStart.next = tpEnd;
  tpEnd.prev = tpStart;
  
  var editing = false;

  function getAttr(name, defval)
  {
    if (svga.attr(name))
    {
      return svga.attr(name);
    }
    return defval;
  }
  
  /**
   * Klasse Koord
   * Dient zum Umrechnen von fachlichen Koordinaten (hier: Zeit und Temperatur)
   * in Pixel-Koordinaten für die svg-Area
   * und zurück.
   * Berücksichtigt die Koordinatenverschiebung!
   */
   function Koord(typ, kx, ky)
   {
      var px, py, fx, fy;
      
      function setPx(kx)
      {
        px = kx;
        fx = (px - px_zeit_0000) * minutes_per_px; // zeit
      }
      
      function setZeit(kx)
      {
        fx = kx;
        px = px_zeit_0000 + fx / minutes_per_px; // zeit
      }
      
      function setPy(ky)
      {
        py = ky;
        fy = (px_temperatur_min - py) / px_per_grad;
      }
      
      function setTemperatur(ky)
      {
        fy = ky;
        py = px_temperatur_min - fy * px_per_grad; // Temperatur in Px von canvas.height herunter
      }
      
      Object.defineProperty(this, "x", {
        get: function() { return px; },
        set: function(x) { setPx(x); }
      });

      Object.defineProperty(this, "y", {
        get: function() { return py; },
        set: function(x) { setPy(x); }
      });

      Object.defineProperty(this, "zeit", {
        get: function() { return fx; },
        set: function(x) { setZeit(x); }
      });

      Object.defineProperty(this, "temperatur", {
        get: function() { return fy; },
        set: function(x) { setTemperatur(x); }
      });

      if (typ == "X")
      {
        this.x = kx;
        this.y = ky;
      }
      else
      {
        this.zeit = kx;
        this.temperatur = ky;
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
    this.shiftStartTo = function(koord)
    {
      koord.zeit = Math.round(koord.zeit/zeit_raster_minuten)*zeit_raster_minuten;
      this.origin.x = koord.x;
      if (this.temperaturLine)
      {
        this.temperaturLine.setAttribute("x1", this.origin.x);
      }

      if (this.timeLine)
      {
        this.timeLine.setAttribute("x1", this.origin.x);
        this.timeLine.setAttribute("x2", this.origin.x);
      }
    
      if (this.circleStart)    this.circleStart.setAttribute("cx", this.origin.x);
      if (this.circleEnd)      this.circleEnd.setAttribute("cx", this.origin.x);
      if (this.temperaturLine) this.temperaturLine.setAttribute("x1", this.origin.x);
    }
    
    // Setze das Ende des TemperaturPoint neu
    // Das wird anhand des folgenden TP gemacht
    this.adjustEnd = function()
    {
      var nx = this.next.origin.x;
      if (this.temperaturLine) this.temperaturLine.setAttribute("x2", nx);
    }
    
    function killSvg(svgo)
    {
      svgo.parentNode.removeChild(svgo);
    }
    
    this.adjustTime = function()
    {
      var ny = this.prev.origin.y;
      if (this.prev.prev == null)
      {
        // Wir sind jetzt das neue erste Element!!!
        // TODO: Wenn timeLine ein Objekt ist, kann es per ref übergeben werden.
        //       Dann kann es auch in killSvg auf null gesetzt werden. (oder zumindest dessen Inhalt)
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
    this.getEnd = function()
    {
      // Unser Ende ist der Anfang unseres Nachfolgers
      return this.next.origin;
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
      var nx = this.getEnd().x;
        
      var sdicke = 3;
      var radius = 3;
      if (editing) 
      {
        sdicke = 5;
        radius = 6;
      }
      // 1. Waagerecht - die Temperatur-Linie
      this.temperaturLine = mwLine(this.origin.x, this.origin.y, nx-this.origin.x, 
                                   "rgb(0,200,0)", sdicke);
      this.temperaturLine.ref = this;
      
      // Brauchen wir auch die ZeitLinie?
      if (this.prev.prev)
      {
        // ny markiert den Anfang unserer Zeitlinie
        var ny = this.prev.origin.y;
		
        // 1. Senkrecht - die Zeit-Linie
        this.timeLine = msLine(this.origin.x, this.origin.y, ny-this.origin.y, "rgb(0,200,0)", sdicke);
        this.timeLine.ref = this;

        this.circleStart = mCircle(this.origin.x, this.origin.y, radius, "rgb(0,0,200)"); 
        this.circleStart.ref = this;

        this.circleEnd = mCircle(this.origin.x, ny, radius, "rgb(0,0,200)"); 
        this.circleEnd.ref = this;
      }
    }
  }

  function getMouseKoords(e, obj)
  {
    //var xxx = $(obj).offset();
    var xxx      = svga.offset();
    var loc = new Koord("X", 
//                        e.pageX - begin_svga_x, 
//                        e.pageY - begin_svga_y);
                        e.pageX - xxx.left, 
                        e.pageY - xxx.top);
    kx.html(loc.x);
    ky.html(loc.y);
    return loc;
  }
  
  // private eventhandler
  // splittet eine Temperaturzeile
  // TODO: Verhindere, daß das Event weitergereicht wird in der Kette.
  function splitLine(e)
  {
    alert("split line");
    var cl = e.currentTarget;
    var xxx = getMouseKoords(e, cl);
    var ctp = cl.ref;
    var ntp = new TemperaturPoint("T", xxx.zeit, ctp.origin.temperatur);
    
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
    
    e.preventDefault();
    e.stopPropagation();
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe links der Zeit
  // TODO: Verhindere, daß das Event weitergereicht wird in der Kette.
  function deleteLeft(e)
  {
    alert("deleteLeft");
    var cl = e.currentTarget;
    var tp = cl.ref.prev;
    var prv = tp.prev;
    var nxt = tp.next;
    nxt.shiftStartTo(tp.origin);
    tp.removeFromList();
    nxt.adjustTime();
    nxt.bringCirclesToFront(svga);
    
    e.preventDefault();
    e.stopPropagation();
  }
  
  // private eventhandler
  // Löscht die Temperaturangabe rechts der Zeit
  // TODO: Verhindere, daß das Event weitergereicht wird in der Kette.
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
    
    e.preventDefault();
    e.stopPropagation();
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

  function logKoord(koord)
  {
    hulpe.html("Zeit " + TimeString(koord.zeit) + " Temp " + koord.temperatur + " °C");
  }
  
  // private eventhandler
  // wird als mousover aufgerufen beim Ziehen der Temperatur-Linie
  function doDragTemp(e)
  {
    var koord = getMouseKoords(e, currentLine);
    
    // aus dem Digramm raus soll es nicht laufen
    if (koord.temperatur > temperatur_max)
    {
      koord.temperatur = temperatur_max;
    }
    if (koord.temperatur < temperatur_min)
    {
      koord.temperatur = temperatur_min;
    }
    
    var tp = currentLine.ref;
    
    tp.origin.temperatur = Math.round(koord.temperatur);

    currentLine.setAttribute("y2", tp.origin.y);
    currentLine.setAttribute("y1", tp.origin.y);
    
    if (tp.timeLine) 
    {
      tp.circleStart.setAttribute("cy", tp.origin.y);
      tp.timeLine.setAttribute("y1", tp.origin.y);
    }
    if (tp.next)
    {
      var e = tp.next;
      if (e.timeLine)  e.timeLine.setAttribute("y2", tp.origin.y);
      if (e.circleEnd) e.circleEnd.setAttribute("cy", tp.origin.y);
    }
    logKoord(tp.origin);
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
    var koord = getMouseKoords(e, currentLine);
    
    // aus dem Digramm raus soll es nicht laufen
    if (koord.time > zeit_max)
    {
      koord.time = zeit_max;
    }
    if (koord.time < zeit_min)
    {
      koord.time = zeit_min;
    }
    
    var tp = currentLine.ref;
    
    // Der Anfang darf nicht vor den Anfang des Vorgängers gelangen
    if (koord.zeit <= tp.prev.origin.zeit + zeit_raster_minuten) 
    {
      koord.zeit = tp.prev.origin.zeit + zeit_raster_minuten;
    }
    
    // Es darf auch nicht zu nahe an das Ende des nächsten TP kommen
    var t = tp.getEnd().zeit;
    if (koord.zeit >= t - zeit_raster_minuten)
    {
      koord.zeit = t - zeit_raster_minuten;
    }

    // neue Startposition setzen
    tp.shiftStartTo(koord);
    
    // Das Ende des Vorgängers anpassen
    tp.prev.adjustEnd();

    logKoord(tp.origin);
  }

  // private eventhandler
  // mousedown - leitet die Verschiebung ein
  function startDragTime(e)
  {
    currentLine = e.currentTarget;
    $(svga).bind("mousemove", doDragTime);
    help.html("start dragging time");
  }

  // public function to retreve the changed (or unchanged) data
  function getData()
  {
    // 1. das Array zusammenstellen
    var idx=0; // erstes Element holen
    var va = new Array();
    for (var tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      va[idx] = new Object();
      va[idx].ts = tp.origin.zeit;
      va[idx].temp = tp.origin.temperatur;
      idx++;
    }
    
    // 2. es als JSON-String zurückgeben
    return JSON.stringify(va);
  }
  
  // private eventhandler
  // mousup - beendet das Verschieben der Linie
  function stoppDrag(e)
  {
    $(svga).unbind("mousemove");
    currentLine = null;
    help.html("end dragging at");
    help.html(getData());
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
      }
      if (tp.timeLine)
      {
        svga.append(tp.timeLine);
      }
    }
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      if (tp.circleStart)
      {
        svga.append(tp.circleStart);
      }
      if (tp.circleEnd)
      {
        svga.append(tp.circleEnd);
      }
    }
  }

  function activateEdit()
  {
    // Entlang des vectors die Handler für die Elemente aktivieren.
    var tp; // erstes Element holen
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      if (tp.temperaturLine)
      {
        $(tp.temperaturLine).bind("mousedown", startDragTemp);
        $(tp.temperaturLine).bind("dblclick", splitLine);
        tp.temperaturLine.setAttribute("stroke-width", 5);
      }
      if (tp.timeLine)
      {
        $(tp.timeLine).bind("mousedown", startDragTime);
        tp.timeLine.setAttribute("stroke-width", 5);
      }
    }
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      if (tp.circleStart)
      {
        $(tp.circleStart).bind("dblclick", deleteRight);
        tp.circleStart.setAttribute("r", 6);
      }
      if (tp.circleEnd)
      {
        $(tp.circleEnd).bind("dblclick", deleteLeft);
        tp.circleEnd.setAttribute("r", 6);
      }
    }
  }
  
  function endEdit()
  {
    // Entlang des vectors die Handler für die Elemente aktivieren.
    var tp; // erstes Element holen
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      if (tp.temperaturLine)
      {
        $(tp.temperaturLine).unbind("mousedown");
        $(tp.temperaturLine).unbind("dblclick");
        tp.temperaturLine.setAttribute("stroke-width", 3);
      }
      if (tp.timeLine)
      {
        $(tp.timeLine).unbind("mousedown");
        tp.timeLine.setAttribute("stroke-width", 3);
      }
    }
    for (tp = tpStart.next; tp.next != null; tp = tp.next)
    {
      if (tp.circleStart)
      {
        $(tp.circleStart).unbind("dblclick");
        tp.circleStart.setAttribute("r", 3);
      }
      if (tp.circleEnd)
      {
        $(tp.circleEnd).unbind("dblclick");
        tp.circleEnd.setAttribute("r", 3);
      }
    }
  }
  
  function doDblClick(e)
  {
    if (editing)
    {
      endEdit();
      editing = false;
    }
    else
    {
      activateEdit();
      editing = true;
    }
  }
  
  function init()
  {
    // zuerst die Position korrigieren und speichern
    adjustOffset();

    // MouseButtonUp zentral registrieren
    $(svga).bind("mouseup", stoppDrag);
    $(svga).bind("dblclick", doDblClick);

    // Hilfsvariable, um fachliche Koordinaten in Pixel umzurechnen
    var zp = new Koord("T", 0, 0);
    // Hintergrund malen
    svga.append(mRect(px_zeit_0000, 
                      px_temperatur_max, 
                      px_zeit_2400 - px_zeit_0000, 
                      px_temperatur_min - px_temperatur_max, 
                      "rgb(200,200,200)"));

    // 1000/24 == 41,666
    // Koordinatensystem zeichnen
    svga.append(mwLine(px_zeit_0000, px_temperatur_min, px_zeit_2400-px_zeit_0000, "rgb(200,0,0)", 3));
    svga.append(msLine(px_zeit_0000, px_temperatur_min, px_temperatur_max - px_temperatur_min, "rgb(200,0,0)", 3));
    
    // Kleine Striche für die Sunden und die °C malen
    // Stunden
    zp.temperatur = 0;
    for (var i=0; i<=24; i++)
    {
      zp.zeit = i*60;
      svga.append(msLine(zp.x, zp.y-4, 8, "rgb(200,0,0)", 1));
    }
    
    // °C
    zp.zeit = 0;
    for (var i=temperatur_min; i<=temperatur_max; i+=5)
    {
      zp.temperatur = i;
      svga.append(mwLine(zp.x-4, zp.y, 8, "rgb(200,0,0)", 1));
    }
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

  var dia = new Diagramm("montag");
  dia.setData('[{"ts":0,"temp":40},{"ts":600,"temp":35},{"ts":820,"temp":30},{"ts":1320,"temp":20}]');
  dia.draw();

  var dia2 = new Diagramm("dienstag");
  dia2.setData('[{"ts":0,"temp":40},{"ts":600,"temp":35},{"ts":820,"temp":30},{"ts":1320,"temp":20}]');
  dia2.draw();
})
