var yaml = require('js-yaml');
var fs = require('fs');
var invoke = require("./invoke")
var overlay = require("./overlay")
var config ;
var jp = require("jsonpath")
var colors = require('colors');

function assert_eq(lhs, rhs, message){
  console.log("Assert: " + message + " : " + ((lhs==rhs)?"PASS".green:"FAIL".red))
}

function assert_neq(lhs, rhs, message){
  console.log("Assert: " + message + " : " + ((lhs!=rhs)?"PASS".green:"FAIL".red))
}

function validate(c,res,bags){
  assert_eq(res.status,c.status,"statuscode")
  if(c.body==undefined) return

  var eq = c.body.eq;
  if(eq!=undefined){
    Object.keys(eq).forEach(v=>{
      assert_eq(jp.query(res.body, v),overlay.layer(eq[v], config, bags),v)
    })
  }

  var neq = c.body.neq;
  if(neq!=undefined){
    Object.keys(neq).forEach(v=>{
      assert_neq(jp.query(res.body, v),overlay.layer(neq[v], config, bags),v)
    })
  }

  var collect = c.body.collect;
  if(bags.length >0 ){
    var collect_bag = bags[0];

    if(collect!=undefined){
      Object.keys(collect).forEach(v=>{
        collect_bag[v] = jp.query(res.body, collect[v])[0]
      })
      console.log(collect_bag)
    }
  }
}

function stephandler(s,bags){
  var intent = Object.keys(s)[0]
  var check = s.check
  var name = overlay.layer(s.name, config, bags);
  var payload = s[intent];
  console.log(("Test: -------"+name+"-----------").cyan)
  payload.url = overlay.layer(payload.url,config, bags)
  var p = Promise.resolve()
  switch(intent){
    case "get":
      p = invoke.get(payload.url,payload.headers)
      break;
    case "post":
      var content = {}
      if(payload.file!=undefined){
        var content = fs.readFileSync(config.payloadFolder+payload.file, 'utf8');
        content = overlay.layer(content,config, bags)
        p = invoke.post(payload.url,payload.headers,content)
      }
      if(payload.json!=undefined){
        var f = fs.readFileSync(config.payloadFolder+payload.json, 'utf8');
        f = overlay.layer(f,config, bags)
        var content = JSON.parse(f)
        var o = JSON.parse(overlay.layer(JSON.stringify(payload.override),config, bags))
        content = override(content, o)
        p = invoke.post_json(payload.url,payload.headers,content)
      }
      if(payload.file==undefined && payload.json==undefined){
        p = invoke.post(payload.url,payload.headers)
      }
      break;
    default:
      break;
  }
  return p.then(b=>{validate(check,b,bags)}).catch(console.error)
}

function override(json, override) {
  if(override!=undefined) {
    Object.keys(override).forEach(v=>{
      jp.value(json,v, override[v])
    })
    return json
  }
}




function all_tests(proj){
  config = requireFromRoot("./" + proj + '/config/index.js')
  config.testFolder = "./"+proj+"/tests/"
  config.moduleFolder = "./"+proj+"/modules/"
  config.payloadFolder = "./"+proj+"/payload/"
  config.modelFolder = "./"+proj+"/models/"

  // do it for all the files in test folder
  fs.readdir(config.testFolder, (err, files) => {
    var result = Promise.resolve();
    files.forEach(file => {
      result = result.then(()=>test_run(config.testFolder  + file));
    });
  })
}

requireFromRoot = (function(root) {
    if(root.indexOf("node_modules")>0) {root = root+"/../../"}
    return function(resource) {
        return require(root+"/"+resource);
    }
})(__dirname);

function test_run(file){
  try {
    var test_stream = fs.readFileSync(file, 'utf8');
    var yml  = replace_yml(test_stream)
    yml  = overlay.layer(yml,config)
    //one more time if there are any placeholders from the modules
    yml  = overlay.layer(yml,config)
    var doc = yaml.safeLoad(yml);
    var result = Promise.resolve();
    var collect_bag = {}
    var blocks = [0]
    if(doc.iterate !=undefined) {
      blocks = requireFromRoot(config.modelFolder + doc.iterate)
    }

    blocks.forEach(block=>{
      doc.steps.forEach(s=>{
        var iterations = [0]
        if(s.iterate!=undefined){
          iterations = requireFromRoot(config.modelFolder + s.iterate)
        }
        iterations.forEach((i,j)=>{
          result = result.then(()=>stephandler(s,[collect_bag,block,i]));
        })
      })
    })

  } catch (e) {
    console.error(e);
  }

  return result
}


function replace_yml(from) {
  var patt1 = /\{\{\w+\}\}/g;
  var result = from.match(patt1);
  if (result == null) return from;
  result.forEach(r=>{
    var file = r.replace("{{","").replace("}}","")
    try {
      if(fs.statSync(config.moduleFolder+file+".yml")) {
        from = from.replace(new RegExp( r, 'g'),include(file))
      }
    }
    catch(e) { }
  })
  return from;
}

function include(file){
  var ls = fs.readFileSync(config.moduleFolder+file+".yml", 'utf8').split("\n");
  for(var i = 0;i<ls.length;i++){
    ls[i]="    "+ls[i]
  }
  ls[0]=ls[0].trim();
  return ls.join("\n")
}

exports.start = all_tests
