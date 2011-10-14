  var o = new Object();
    var va = new Array();
  o.ts = 0;
  o.temp = 10;  
  va[0] = o;
  o = new Object();
  o.ts = 10*60;
  o.temp = 30;  
  va[1] = o;
  o = new Object();
  o.ts = 22*60;
  o.temp = 20;  
  va[2] = o;

  var str = JSON.stringify(va); //jQuery.parseJSON(data);
