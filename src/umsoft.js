"use strict";
// (c) Ulf Michaelis
// enthält geklauten Code aus anderen Quellen
// setzt jquery voraus
var glob_lp;
var glob_cnt = 0;
//init_meter = function()
//$(function()
//{
// support for <meter>, if not supported
// Idee: Auf dieser Basis ein Element entwerfen, dessen Farbe zwischen blau (kalt) und rot (heiß) changiert
// und das deshalb Wärmewerte anzeigen kann.
// Möglicherweise muß dafür ein eigener Gradient gebaut werden.

$("meter").each(function() 
{
  var meter = $(this);
  var label = $("<span>" + meter.html() + "</span>"); 
  label.addClass("label");

  var fill = $("<div></div>"); 
  fill.addClass("fill");
  fill.css("width",(meter.attr("value") / meter.attr("max") * 100) + "%"); 
  fill.append("<div style='clear:both;'><br></div>");
      
  meter.html(""); 
  meter.append(fill);
  meter.append(label);
});

$(function()
{ 
  $("#time").html("4711");
  $("#context_started").html("47:11");
})
	
var myAjaxErrorHandler = function(xhr, errmsg, err)
{
  alert("Ajax failed: " + errmsg + " : " + err);
  clearInterval(glob_lp);
}
     
$.ajaxSetup({ error: myAjaxErrorHandler });
function lpReq() 
{
  $.getJSON("/LP", function(data)
  {
    var name;
    for (name in data)
    {
      $("." + name).each(function(i) 
      {
        $(this).html(data[name]);
      });
    }
    
    glob_lp = setTimeout(lpReq, 500);
  });
}

function f0(z)
{
  var s = z.toString();
  if (s.length < 2)
  {
    return "0" + s;
  }
  return s;
}

function DateString(d)
{
  var res = f0(d.getDate()) + "." + f0(d.getMonth()) + "." + d.getFullYear();
  res += " " + f0(d.getHours()) 
  res += ":" + f0(d.getMinutes()) 
  res += ":" + f0(d.getSeconds());
  return res;
}

function UpDate()
{
  var ds = DateString(new Date());
  $(".ctime").each(function(i) 
  {
    $(this).html(ds);
  });
}

$(function()
{ 
  // starte alle 2 Sekunden einen Polling-Request
  glob_lp = setTimeout(lpReq, 500);
  setInterval(UpDate, 1000);
})

