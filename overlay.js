var fs = require("fs");
var mustache = require("mustache")
mustache.escape = function(text) {return text;};

function layer(from, meta, bags){
  if(from == undefined) return from;
  if(from === true || from === false) return from;
  if(bags==undefined) bags = []
  if (typeof from == 'number') {from = from.toString()}
  var out =  mustache.render(from,meta);
  bags.forEach(bag=>{
    out = repaint(out,bag)
  })
  return out;
}

// Overlays the contents from collect bag for all ~placeholders~
function repaint(str, collect_bag){
  if(collect_bag==undefined) return str;
  if (typeof str == 'number') {str = str.toString()}
  Object.keys(collect_bag).forEach(v=>{
    var fromBag = collect_bag[v]
    if(typeof fromBag == "object")
      fromBag = JSON.stringify(fromBag[0]); // figure out [0] mistry

    str = str.replace(new RegExp("~"+v+"~", 'g'),fromBag)
  })
  return str

}


exports.layer = layer
