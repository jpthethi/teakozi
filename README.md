# Teakozi

Teakozi is a declarative REST API testing framework for testing micro-services. Here are the capabilities.

  - Writing tests as readable YML files
  - Externalize the configuration / environment specific parameters
  - Dynamic Data - Collect Property and use it in subsequent steps.
  - Scenario based testing. Externalize the test data and validation data from test specification
  - Reuse API calls in multiple tests

# How to use

  - include teakozi in your node application

```sh
$ npm install teakozi
```

create a project consisting of the following subdirectories
  - tests
  - tests/<testname>.yml
  - modules
  - modules/<modulename>.yml
  - models
  - models/<modelxx>.js
  - config
  - config/index.js
  - payload
  - payload/<xxx>.json

### Call the test from .js file

```
require("teakozi").start("project/example")
```


### Structure of a test yml file

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
|iterate|optional|string|name of the module that returns array of objects. the call will get repeated for each of the members of the returned array |
|check|required|object|what to do with the response recieved. What asserts to do and what properties to pick from the response to be used in subsequent calls|

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

### check
| Property |required| type | Purpose|
| - | - |-|-|
|status|optional|number|what status code is expected in response |
|eq|optional|object|the jsonpaths that should be equal to |
|neq|optional|object|the jsonpaths that should notbe equal to |
|collect|optional|object|the jsonpaths values that should be collected for use in subsequent calls. |

```sh
    check:
     status: 200
     body:
      eq:
       $.length: 20
       $..[0].name: "devops_best_practices"
      neq:
       $.length: 0
      collect:
       title: $..[0].name
       project_id: $..[0].id

```

License
----
MIT
