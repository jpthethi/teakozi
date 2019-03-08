var request = require('request');
var fs = require("fs")
var path = require("path")

this.local = function (file,dir) {
  return new Promise((resolve,reject)=>{
    fs.readFile(dir+file, function(error,body){
      if (error) { reject(error) }
      else {
        resolve({body:JSON.parse(body)})
      }
    });
  })
}

this.get = function (url,headers){
  return new Promise((resolve,reject)=>{
    var options = {
      url : url,
      method: 'GET',
      headers:headers
    };

    request(options, function (error, response, body) {

      if (error) { reject(error) }
      else {
        resolve({status: response.statusCode,body:JSON.parse(body)})
      }
    });

  })
}

this.delete = function (url,headers){
  return new Promise((resolve,reject)=>{
    var options = {
      url : url,
      method: 'DELETE',
      headers:headers
    };

    request(options, function (error, response, body) {
      if (error) { reject(error) }
      else {
        resolve({status: response.statusCode,body:JSON.parse(body)})
      }
    });
  })
}

this.post_json = function (url,headers,msg){
  var options = {
    url : url,
    method: 'POST',
    headers:headers,
    body: msg,
    json:true
  };
  return post_generic(url,headers,msg,options)
}


this.post = function (url,headers,msg){
  var options = {
    url : url,
    method: 'POST',
    headers:headers
  };
  if(msg !=undefined) {options.body = msg}
  return post_generic(url,headers,msg,options)
}

this.put = function (url,headers,msg){
  var options = {
    url : url,
    method: 'PUT',
    headers:headers
  };
  if(msg !=undefined) {options.body = msg}
  return post_generic(url,headers,msg,options)
}

this.put_json = function (url,headers,msg){
  var options = {
    url : url,
    method: 'PUT',
    headers:headers,
    body: msg,
    json:true
  };
  return post_generic(url,headers,msg,options)
}


this.patch = function (url,headers,msg){
  var options = {
    url : url,
    method: 'PATCH',
    headers:headers
  };
  if(msg !=undefined) {options.body = msg}
  return post_generic(url,headers,msg,options)
}

this.patch_json = function (url,headers,msg){
  var options = {
    url : url,
    method: 'PATCH',
    headers:headers,
    body: msg,
    json:true
  };
  return post_generic(url,headers,msg,options)
}


function post_generic(url,headers,msg,options){
  return new Promise((resolve,reject)=>{
    request(options, function (error, response, body) {
      if(typeof body == "string" ) {
        try {
          body = JSON.parse(body)
        }
        catch(e) {console.log("response cannot be converted to json")}
      }
      if (error) { reject(error) }
      else { resolve({status: response.statusCode,body:body}) }
    });

  })
}

module.exports = this;
