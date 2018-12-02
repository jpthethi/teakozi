const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const findDocuments = function(db, collectionName, query, callback) {
  const collection = db.collection(collectionName);
  collection.find(query).toArray(function(err, docs) {
    assert.equal(err, null);
    callback(docs);
  });
}


var query = function (serverUrl, dbName, collectionName, queryObj){
  return new Promise(function(resolve, reject){
    MongoClient.connect(serverUrl,{ useNewUrlParser: true }, function(err, client) {
      if(err!=null){
        resolve({status:500,error:err, body:{}});
        return
      }

      var db = client.db(dbName);
      findDocuments(db,collectionName, queryObj , function(d){
        client.close();
        resolve({status:200,body:d})
        return
      })
    });

  })

}

exports.query = query
