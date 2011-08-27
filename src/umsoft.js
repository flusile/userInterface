// (c) Ulf Michaelis
// enthält geklauten Code aus anderen Quellen
// setzt jquery voraus
var glob_lp;
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
		$("#time").html("4711");
      });

	$(function(){ 
		$("#time").html("4711");
		$("#context_started").html("47:11");
	})
	
     var myAjaxErrorHandler = function(xhr, errmsg, err)
     {
        alert("Ajax failed: " + errmsg + " : " + err);
        clearInterval(glob_lp);
     }
     
     $.ajaxSetup({ error: myAjaxErrorHandler });
	var lpReq = function() 
	{
		$.getJSON("/LP", function(data)
		{
			for (name in data)
			{
				$("." + name).each(function(i) {
				  $(this).html(data[name]);
				});
			}
		});
	}

	$(function(){ 
		// starte alle 2 Sekunden einen Polling-Request
		glob_lp = setInterval("lpReq()", 2000);
      //lpReq();
	})

	//})
