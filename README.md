[![npm version](https://badge.fury.io/js/teakozi.svg)](https://badge.fury.io/js/teakozi) [![Build Status](https://travis-ci.org/jpthethi/teakozi.svg?branch=master)](https://travis-ci.org/jpthethi/teakozi)

# Teakozi

Teakozi is a declarative REST API testing framework for testing micro-services. Here are the capabilities.

  - Writing tests as readable YML files
  - Externalize the configuration / environment specific parameters
  - Dynamic Data - Collect Property and use it in subsequent steps.
  - Scenario based testing. Externalize the test data and validation data from test specification
  - Reuse API calls in multiple tests

# How to use Teakozi

  - include teakozi in your node application

```sh
$ npm install teakozi
```

create a directory in your project consisting of the following subdirectories
  - tests
  - tests/[testname].yml
  - modules
  - modules/[modulename].yml
  - models
  - models/[modelxx].js
  - config
  - config/index.js
  - payload
  - payload/[xxx].json


| Directory | Purpose|
|-|-|
|tests|contains the yml files that describe the tests|
|modules|reusable test steps that can be refered in the test yml file|
|models|externalize the data to drive the tests|
|config|just one index.js file that contains key value for replacing in the test yml files|
|payload|the body of the content that can be called in a post step|

see the example folder in the repo for reference. you need to update the config/index.js with your github auth to

## Externalize data from tests
Teakozi allows you to externalize the data from test definition
### Reusable modules
you can refer to the steps in the module as - {{module name}}
### Configuration data
{{xxx}} marked content gets replaced from the configuration file keys-> value
### Dynamic data
you can collect data in a step and reuse in the subsequent steps. so you can collect title and refer it in subsequent steps like ~title~

## Calling the tests from your node app

in a .js file call

```
require("teakozi").start("project/example")
```


## Structure of a test yml file (tests directory)

| Property |required| type | Purpose|
| - | - |-|-|
|name|required|string|Name of the Test Case |
|iterate|optional|string|Name of the module file that returns an array of objects. The test steps defined will be repeated for all the elements of this array |
|steps|required|array|See Steps Section|

### Steps
| Property |required| type | Purpose|
| - | - |-|-|
|get / post / put / delete|required|object|method to be called |
|name|required|string|Name of the Test Step |
|delay|optional|int|Delay in seconds to start this step |
|iterate|optional|string|name of the module that returns array of objects. the call will get repeated for each of the members of the returned array |
|check|required|object|what to do with the response recieved. What asserts to do and what properties to pick from the response to be used in subsequent calls|
|collect|optional|object|the jsonpaths values that should be collected for use in subsequent calls. |
|print|optional|array|the jsonpaths values that should be printed on the console output for debugging purposes |

### get / post / put / delete
| Property |required| type | Purpose|
| - | - |-|-|
|url|required|string|The API to be called |
|json|na -get, optional - for post, optional - put, na - delete |string|the name of file in modules that returns the json to be posted |
|file|na -get, optional - for post, optional - put, na - delete |string| Name of the file in modules (plain text) that needs to be posted |
|override|na -get, optional - for post, optional - put, na - delete |array|  jsonpaths that need to be updated with value |
|headers|optional -get, optional - for post, optional - put, optional - delete |array| headers that go on the http requests. like Authorization content-type etc |

example:
```sh
post:
     url: "https://api.github.com/gists/~gist_id~/comments"
     json: "create_comment.json"
     override:
      $.body: ~comment_text~
     headers:
      Authorization: Basic xxxx
      content-type: application/json
      User-Agent: Teakozi-test
```

### collect
Collects the propoerties from the payload response that would be used in the subsequent steps
```sh
    collect:
     title: $..[0].name
     project_id: $..[0].id
```

### print
Enables debugging of the call by printing the jsonpaths from the response

```sh
  - get:
     url: "http://localhost:3060/k.json"
    name: "Get Auth K"
    print:
     - status
     - $.mykey
    check:
     status: 200
    collect:
     auth_key: $.mykey
```

### check
| Property |required| type | Purpose|
| - | - |-|-|
|status|optional|number|what status code is expected in response |
|eq|optional|object|the jsonpaths that should be equal to |
|neq|optional|object|the jsonpaths that should notbe equal to |
|null|optional|array|the jsonpaths that should be null |

```sh
    check:
     status: 200
     body:
      eq:
       $.length: 20
       $..[0].name: "devops_best_practices"
      neq:
       $.length: 0
      null:
       - $.nonexistant
       - $.someother_nonexistant


```

License
----
ISC
