"use strict";
// (c) Ulf Michaelis
// enthält geklauten Code aus anderen Quellen
// setzt jquery voraus
var glob_lp;
var glob_cnt = 0;
var LPStat;
 
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
  $("#acount").html("0");
  $("#context_started").html("47:11");
})
	
var myAjaxErrorHandler = function(xhr, errmsg, err)
{
  alert("Ajax failed: " + errmsg + " : " + err);
  clearTimeout(glob_lp);
  glob_lp = null;
  LPStat.html("Notaus");
  glob_lp = setTimeout(lpReq, 5000);
}
     
$.ajaxSetup({ error: myAjaxErrorHandler });
function lpReq() 
{
  var acount = $("#acount").html();
  LPStat.html("req LP " + acount);
  $.getJSON("/LP?" + acount, function(data)
  {
    LPStat.html("LP responded");
    var name;
    for (name in data)
    {
      $("." + name).each(function(i) 
      {
        LPStat.html("LP setze " + name + " auf " + data[name]);
        $(this).html(data[name]);
      });
      if (name == "sensor_ZentralVorlauf")
      {
        var mb = $("#meter_ZentralVorlauf")
        mb.attr("value", data[name]);
      }
      else if (name == "sensor_BrauchWasser")
      {
        var mb = $("#meter_BrauchWasser")
        mb.attr("value", data[name]);
      }	
    }
    
    // jetzt die Meter setzen
    
    glob_lp = setTimeout(lpReq, 500);
    LPStat.html("LP TO neu gesetzt");
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
  LPStat = $("#LPStatus");
  if (location.protocol != "file:")
  {
	// starte alle 2 Sekunden einen Polling-Request
	// Wenn wir von einem Server kommen
	//glob_lp = setTimeout(lpReq, 500);
	LPStat.html("ein");
	lpReq();
	/*LPStat.onclick(function() {
		if (glob_lp == null)
		{
			glob_lp = setTimeout(lpReq, 500);
			LPStat.html("ein");
		}
	});*/
  }
  else
  {
	LPStat.html("deaktiviert");
  }
  setInterval(UpDate, 1000);
})

