const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const findDocuments = function(db, collectionName, query, callback) {
  const collection = db.collection(collectionName);
  if(query==null) query={}
  console.log("query")
  console.log(query)
  collection.find(query).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("-----------debug 0----------")
    console.log(docs)
    callback(docs);
  });
}


var query = function (serverUrl, dbName, collectionName, queryObj){
  return new Promise(function(resolve, reject){
    MongoClient.connect(serverUrl,{ useNewUrlParser: true }, function(err, client) {
      if(err!=null){
        resolve({status:500,error:err, body:{}});
      }

      var db = client.db(dbName);
      findDocuments(db,collectionName, queryObj , function(d){
        console.log("-----------debug 1----------")
        console.log(d)
        resolve({status:200,body:d})
        client.close();
      })
    });

  })

}

exports.query = query
