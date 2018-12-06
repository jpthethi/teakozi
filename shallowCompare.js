
//sub and super set
function isArSubset(v,o,key,seq){
  for(var i = 0; i < v.length ;i++){
    var elem = v[i]
    if(o==undefined) {return false};

    var elem2 = o.filter(r=>{return r[key] == elem[key]})

    // if no matiching object found then fail
    if(elem2.length == 0 ) {console.log("Array Gap : " + key + " : " + elem[key]);return false}

    // if no matiching object found then fail
    if(!isShallowEqual(elem,elem2[0],seq)) return false;

  }
  return true
}


//sub and super set
function isShallowEqual(v, o, seq) {
  var nm = []
  for(var key in v){

    if(Array.isArray(v[key])){ //Ignore Array for now
      if(seq[key]==undefined)
        continue;
      if(!isArSubset(v[key],o[key],seq[key],seq))
        nm.push("Not Matching array  : " + key)
      continue
    }

    if(typeof v[key] =="object"){
      if (!isShallowEqual(v[key], o[key], seq)) {
        nm.push("Not Matching key : " + key)
      }
      continue;
    }

    if(!(key in o) || v[key] !== o[key]){
      nm.push("Not Matching value : " + key)
    }

  }
  if(nm.length!=0) nm.forEach(m=>{console.log(m)})
  return nm.length==0
}

exports.isShallowEqual = isShallowEqual
exports.isArSubset = isArSubset
