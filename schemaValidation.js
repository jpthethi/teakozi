var swaggerValidator = require('swagger-object-validator');
var validator;

function setSwagger(swagger){
  validator = new swaggerValidator.Handler(swagger);

}

var validateSchema = function(obj,schema){
  if(!validator) return Promise.reject("No Swagger defined for schema validation")
  return new Promise(function(resolve, reject){
    validator.validateModel(obj,schema, function (err, result) {
      if (err) {reject("Invalid Swagger or schema " + schema + " not found")}
      else {
        if(result.errors.length==0){
          resolve(result.humanReadable())
        } else {
          console.log(result.humanReadable())
          reject (result.humanReadable())
        }
      }
    });
  })
}

exports.setSwagger = setSwagger;
exports.validate = validateSchema;
