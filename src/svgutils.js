"use strict";

function mLine(x1, y1, x2, y2, farbe, dicke)
{
  var obj = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  obj.setAttribute("stroke",       farbe);
  obj.setAttribute("stroke-width", dicke);
  obj.setAttribute("x1",           x1);
  obj.setAttribute("y1",           y1);
  obj.setAttribute("x2",           x2);
  obj.setAttribute("y2",           y2);
  return obj;
}

function msLine(x, y, len, farbe, dicke)
{
  return mLine(x, y, x, y+len, farbe, dicke);
}

function mwLine(x, y, len, farbe, dicke)
{
  return mLine(x, y, x+len, y, farbe, dicke);
}

function mRect(x, y, xlen, ylen, colour)
{
  var obj = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  obj.setAttribute("stroke",       colour);
  obj.setAttribute("fill",         colour);
  obj.setAttribute("x",            x);
  obj.setAttribute("y",            y);
  obj.setAttribute("width",        xlen);
  obj.setAttribute("height",       ylen);
  return obj;
}

function mSquare(x, y, len, colour)
{
  return mRect(x, y, len, len, colour);
}

function mCircle(x, y, radius, colour)
{
  var obj = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  obj.setAttribute("stroke",       colour);
  obj.setAttribute("fill",         colour);
  obj.setAttribute("cx",           x);
  obj.setAttribute("cy",           y);
  obj.setAttribute("r",            radius);
  return obj;
}

