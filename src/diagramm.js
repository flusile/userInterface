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
  var va; // value-array. Enthält die Temperatur- und Zeit-Angaben
  var svga = $("#" + id);; // die svg-area, auf der wir malen
  var svg_width = 24*30; // die Breite des Diagramms
  var svg_height = 300;  // die Höhe des Diagramms

  // private Function for writing a line
  function addTempLine(idx, x, y, len)
  {
    var tl = mwLine("templine_" + idx, x, y, len, "rgb(0,200,0)", 3);
    tl.setAttribute("ref", idx);
    $(tl).bind("mousedown", startDrag);
    svga.append(tl);
    va[idx].tempLine = tl;
    va[idx].c1 = mCircle("temp_pt_" + idx, x, y, 6, "rgb(0,0,200)"); 
    va[idx].c1.setAttribute("ref", idx);
    svga.append(va[idx].c1);
  }

  function addTimeLine(idx, x, y, len)
  {
    va[idx].timeLine = msLine("timeline_" + idx, x, y, len, "rgb(0,200,0)", 3);
    va[idx].timeLine.setAttribute("ref", idx);
    svga.append(va[idx].timeLine);
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
  
  // EventHandler
  function doDrag(e)
  {
    var xxx = $(currentLine).offset();
    //xxx.left = e.pageX - col;
    xxx.top = e.pageY - cot;
    kx.html(xxx.left);
    ky.html(xxx.top);
    
    var delta = currentLine.getAttribute("y1") - xxx.top;
    
    currentLine.setAttribute("y2", xxx.top);
    currentLine.setAttribute("y1", xxx.top);
    var idx = currentLine.getAttribute("ref");
    va[idx].temp = (xxx.top + svg_height) / 5;
    va[idx].c1.setAttribute("cy", xxx.top);
    if (va[idx].timeLine) 
    {
      hulpe.text(va[idx].timeLine.getAttribute("y1"));
      va[idx].timeLine.setAttribute("y1", va[idx].timeLine.getAttribute("y1")*1 - delta);
    }
    if (idx > 0)
    {
      var e = va[idx-1];
      if (e.timeLine)
      {
        e.timeLine.setAttribute("y2", e.timeLine.getAttribute("y2")*1 - delta);
      }
    }
  }

  function startDrag(e)
  {
    currentLine = e.currentTarget;
    $(svga).bind("mousemove", doDrag);
    help.html("start dragging");
  }

  function stoppDrag(e)
  {
    $(svga).unbind("mousemove");
    currentLine = null;
    help.html("end dragging at");
  }

  // public function zum Setzen der Daten
  this.setData = function(data) 
  {
    va = jQuery.parseJSON(data);
  }
  
  // public function zum Zeichnen des Diagramms
  this.draw = function()
  {
    // Entlang des vectors die Linien zeichnen.
    var x=0; // zeit
    var y=0; // Temperatur in Px von canvas.height herunter
    var idx;    
    for (idx in va)
    {
      var e = va[idx]
      var nx=e.ts/2;	
      var ny=svg_height - e.temp*5;
      if (nx != 0)
      {
        // 1. Waagerecht - die Temperatur-Linie
        addTempLine(idx-1, x, y, nx-x);

        // 1. Senkrecht - die Zeit-Linie
        addTimeLine(idx-1, nx, y, ny-y); 
      }

      x=nx;
      y=ny;
    }
  
    // zum schluss die letzte waagerechte Temperatur-Linie
    addTempLine(idx, x, y, svg_width-x);
  }

  function init()
  {
    // zuerst die Position korrigieren und speichern
    adjustOffset();

    // MouseButtonUp zentral registrieren
    $(svga).bind("mouseup", stoppDrag);

    // Hintergrund malen
    // TODO: Der Hintergrund hat jetzt keinen Platz für Beschriftung!!!
    svga.append(mRect("ground", 0, 0, svg_width, svg_height, "rgb(200,200,200)"));

    // 1000/24 == 41,666
    // Koordinatensystem zeichnen
    svga.append(mwLine("koord_h", 0, svg_height, svg_width, "rgb(200,0,0)", 3));
    svga.append(msLine("koord_v", 0, 0, svg_height, "rgb(200,0,0)", 3));
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


