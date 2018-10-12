var yaml = require('js-yaml');
var fs = require('fs');
var invoke = require("./invoke")
var overlay = require("./overlay")
var config ;
var jp = require("jsonpath")
var colors = require('colors');

function assert_eq(lhs, rhs, message,add){
  var assertObj={}
  assertObj.valid = (lhs==rhs)
  assertObj.detail = "Expected " + message + " : " + lhs + " got " + rhs;
  assertObj.message = ("Assert: " + message + " : " + (assertObj.valid?"PASS".green:"FAIL".red))
  if(add!=undefined) add(assertObj)
}

function assert_neq(lhs, rhs, message, add){
  var assertObj={}
  assertObj.valid = (lhs!=rhs)
  assertObj.detail = "Not expected " + message + " : " + lhs + " got " + rhs ;
  assertObj.message = "Assert: " + message + " : " + (assertObj.valid?"PASS".green:"FAIL".red)
  if(add!=undefined) add(assertObj)
}

function assert_null(lhs, message, add){
  var assertObj={}
  assertObj.valid = (lhs[0]==undefined)
  assertObj.detail = "Expected " + message + " to be null" ;
  assertObj.message = "Assert: " + message + " : " + (assertObj.valid?"PASS".green:"FAIL".red)
  if(add!=undefined) add(assertObj)
}


function collect(collect,res,bags){
  if( collect==undefined ) return;
  if(bags.length > 0 ){
    var collect_bag = bags[0];
    if(collect!=undefined){
      Object.keys(collect).forEach(v=>{
        collect_bag[v] = jp.query(res.body, collect[v])[0]
      })
    }
  }
}

function validate(c,res,bags){
  var ret = {
    asserts:[],
    valid : true
  }
  if(c==undefined) return ret

  var add = function(assertObj){
    ret.asserts.push(assertObj);
    console.log(assertObj.message)
    delete assertObj.message
    ret.valid = ret.valid && assertObj.valid;
  }

  if(c.status!=undefined){
    assert_eq(res.status,overlay.layer(c.status, config, bags),"statuscode",add)
  }
  if(c.body==undefined) return ret

  var eq = c.body.eq;
  if(eq!=undefined){
    Object.keys(eq).forEach(v=>{
      assert_eq(jp.query(res.body, v),overlay.layer(eq[v], config, bags),v,add)
    })
  }

  var neq = c.body.neq;
  if(neq!=undefined){
    Object.keys(neq).forEach(v=>{
      assert_neq(jp.query(res.body, v),overlay.layer(neq[v], config, bags),v,add)
    })
  }

  var check_null = c.body.null;
  if(check_null!=undefined){
    check_null.forEach(v=>{
      assert_null(jp.query(res.body, v),v,add)
    })
  }
  return ret;
}

function stephandler(s,bags){
  var ret = {
    start:new Date,
    end:"",
    valid: false,
    error:undefined
  }

  var intent = Object.keys(s)[0]
  var check = s.check
  var name = overlay.layer(s.name, config, bags);
  var payload = s[intent];
  ret.name = name
  console.log(("Test: -------"+name+"-----------").cyan)
  payload.url = overlay.layer(payload.url,config, bags)

  //overlay headers
  if(payload.headers != undefined){
    Object.keys(payload.headers).forEach(h=>{
      payload.headers[h] = overlay.layer(payload.headers[h],config, bags)
    })
  }


  ret.url = payload.url;
  ret.method = intent;
  console.log(ret.method + " " + ret.url)
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
    case "put":
      var content = {}
      if(payload.file!=undefined){
        var content = fs.readFileSync(config.payloadFolder+payload.file, 'utf8');
        content = overlay.layer(content,config, bags)
        p = invoke.put(payload.url,payload.headers,content)
      }
      if(payload.json!=undefined){
        var f = fs.readFileSync(config.payloadFolder+payload.json, 'utf8');
        f = overlay.layer(f,config, bags)
        var content = JSON.parse(f)
        var o = JSON.parse(overlay.layer(JSON.stringify(payload.override),config, bags))
        content = override(content, o)
        p = invoke.put_json(payload.url,payload.headers,content)
      }
      if(payload.file==undefined && payload.json==undefined){
        p = invoke.put(payload.url,payload.headers)
      }
      break;
    case "delete":
      p = invoke.delete(payload.url,payload.headers)
      break;
    default:
      break;
  }
  return new Promise(function(resolve, reject){
    p
    .then(b=>{
      ret.debug_prints = debug_print(s.print,b);
      collect(s.collect,b,bags);
      var v = validate(check,b,bags);
      ret.end=new Date();
      ret.duration = ret.end-ret.start;
      ret.asserts = v.asserts;
      ret.valid = v.valid;
      resolve(ret)})
    .catch(e=>{ret.error = e; reject(ret)})
  })
}

function debug_print(print,res){
  var ret = []
  if(print!=undefined){
    print.forEach(v=>{
      var msg;
      if(v=="status") {
        msg = v + " : " + res.status
      }
      else {
        msg = v + " : " + jp.query(res.body, v)
      }
      console.log(msg);
      ret.push(msg);
    })
  }
  return ret
}

function override(json, override) {
  if(override!=undefined) {
    Object.keys(override).forEach(v=>{
      jp.value(json,v, override[v])
    })
    return json
  }
}

function all_tests(proj,dir){
  if(dir!=undefined){
    requireFromRoot = (function(root) {
      return function(resource) {
          return require(root+"/"+resource);
      }
    })(dir);
  }

  config = requireFromRoot("./" + proj + '/config/index.js')
  config.testFolder = "./"+proj+"/tests/"
  config.moduleFolder = "./"+proj+"/modules/"
  config.payloadFolder = "./"+proj+"/payload/"
  config.modelFolder = "./"+proj+"/models/"
  config.logFolder = "./"+proj+"/logs/"

  if (!fs.existsSync(config.logFolder)){
    fs.mkdirSync(config.logFolder);
  }

  // do it for all the files in test folder
  fs.readdir(config.testFolder, (err, files) => {
    var result = Promise.resolve();
    files.forEach(file => {
      result = result.then(()=>test_run(config.testFolder  + file));
    });
  })
}

var requireFromRoot = (function(root) {
    if(root.indexOf("node_modules")>0) {root = root+"/../../"}
    return function(resource) {
        return require(root+"/"+resource);
    }
})(__dirname);

function test_run(file){
  var test_log = {steps:[],errors:[],start:new Date(),end:""}
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
          var cloned_step = JSON.parse(JSON.stringify(s))
          result = result.then(x=>{
            var delay_secs = cloned_step.delay!=undefined?cloned_step.delay*1000:0
            return delay(delay_secs).then(function(){
              return stephandler(cloned_step,[collect_bag,block,i])
            })
          }).then(x=>{
            test_log.steps.push(x);
          }).catch((x)=>{
            console.error("Error".red)
            console.error((x.error))
            test_log.steps.push(x);
          });
        })
      })
    })
    result.then(r=>{
      test_log.end = new Date();
      test_log.duration = test_log.end-test_log.start;

      var ts = date_stamp(new Date());
      fs.writeFile(config.logFolder+ts+".json", JSON.stringify(test_log), (err) => {
        if(err) console.log(err);
        console.log('The file has been saved!');
      });
      //console.log("-----------Test Log------------")
      //console.log(test_log)
    })
  } catch (e) {
    console.error(e);
  }
  return result
}

function delay(t, v) {
  if(t>0){
    console.log("-------Delay "+ (t/1000) +" seconds -------")
  }
 return new Promise(function(resolve) {
   setTimeout(resolve.bind(null, v), t)
 });
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

function date_stamp(dt) {
  var dd = dt.getDate();
  var mm = dt.getMonth()+1;
  var yy = dt.getFullYear();
  var hh = dt.getHours()
  var m = dt.getMinutes()
  var s = dt.getSeconds()
  if(dd<10) { dd='0'+dd; }
  if(mm<10) { mm='0'+mm; }
  return ""+yy+mm+dd+"_"+hh + m + s

}


exports.start = all_tests
