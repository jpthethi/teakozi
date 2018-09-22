var fs = require("fs");
var mustache = require("mustache")
mustache.escape = function(text) {return text;};

function layer(from, meta, bags){
  if(from == undefined) return from;
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
    str = str.replace(new RegExp("~"+v+"~", 'g'),collect_bag[v])
  })
  return str

}


exports.layer = layer
