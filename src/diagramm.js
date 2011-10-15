"use strict";

var kx;
var ky;
var help;

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
  function addTempLine(id, x, y, len)
  {
    var tl = mwLine("templine_" + id, x, y, len, "rgb(0,200,0)", 3);
    $(tl).bind("mousedown", startDrag);
    svga.append(tl);
    svga.append(mCircle("temp_pt_" + id, x, y, 6, "rgb(0,0,200)"));
  }

  function addTimeLine(id, x, y, len)
  {
    svga.append(msLine("timeline_" + id, x, y, len, "rgb(0,200,0)", 3));
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
    //  $(currentLine).offset(xxx);
    currentLine.setAttribute("y2", xxx.top);
    currentLine.setAttribute("y1", xxx.top);
    //obj.setAttribute("y2",           y2);
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
    $(svga).bind("mouseup", stoppDrag);
    adjustOffset();

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
  
  kx.html(77);
  ky.html(88);
  help.html("dunno");

  var dia = new Diagramm("svg");

  dia.setData('[{"ts":0,"temp":10},{"ts":600,"temp":30},{"ts":820,"temp":35},{"ts":1320,"temp":20}]');
  
  dia.draw();
})


