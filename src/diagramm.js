var canvas;

$(function()
{
  canvas = document.getElementById("diagramm_1");  //$("#diagramm_1");
  var ctx = canvas.getContext("2d"); 
  
  var data = '[{"ts":0,"temp":10},{"ts":600,"temp":30},{"ts":1320,"temp":20}]';
  
  var va = new Array();
  va = jQuery.parseJSON(data);

  $("#hilfe").html(str);
  canvas.width = 24*30; // max. 1000, Tageszeit
  canvas.height = 200; // Temperatur
  
  // Hintergrund malen
  ctx.fillStyle = "rgb(200,200,200)";  
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1000/24 == 41,666
  // Koordinatensystem zeichnen
  
  ctx.fillStyle = "rgb(200,0,0)";  
  ctx.fillRect(0, 199, 24*60, 1);
  ctx.fillRect(0, 0, 1, 200);
  
  //var obj = jQuery.parseJSON(data);
  //$("#hilfe").html(obj);
  /*.each(function(data) 
  {
	$("#hilfe").html($("#hilfe").html() + data);
  });*/
})
