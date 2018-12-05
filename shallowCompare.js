
//sub and super set
function isArSubset(v,o,key){
  for(var i = 0; i < v.length ;i++){
    var elem = v[i]
    if(o.indexOf(elem)==-1) return false
  }
  return true
}

//sub and super set
function isShallowEqual(v, o) {
  var nm = []
  for(var key in v){
    if(Array.isArray(v[key])){ //Ignore Array for now
      continue;
    }

    if(typeof v[key] =="object"){
      if (!isShallowEqual(v[key], o[key])) {
        nm.push("Not Matching key : " + key)
      }
      continue;
    }

    if(!(key in o) || v[key] !== o[key]){
      nm.push("Not Matching value : " + key)
    }

  }
  if(nm.length!=0) console.log(nm)
  return nm.length==0
}

exports.isShallowEqual = isShallowEqual
exports.isArSubset = isArSubset
