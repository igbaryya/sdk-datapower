# SDK Data types validator
SDK-Datapower is Layer that will sit between FE host to BE host and validate REST request payloads & query params based on Swaggers JSONs. 
It is very importnant for your server security to validate requests types before it reachs BE, for example if you have POST REST that defined in swagger with 
object A: {
  properties: 
     b: 
       type: number 
}  

and FE request from that REST with POST payload as below:
A: {
  b: "123A"
}

This request suppose to fail since it is not match swagger type for this REST. Instead of failing on BE and causing different issues. 


### Overview:
![overview](https://i.snipboard.io/SLUu41.jpg)
### Env Installation
Require: 
- nodeJS
- Swagger (YAMLs) converted as JSONs in nexus. 
  - See this example to add maven YML2JSON convertor script: https://stackoverflow.com/a/57790537/6063698

SDK-DataPower can be ran in your Local Machine or in UNIX envs.

Desktop: 
```sh
npm install
node .\src\server.js --endpoint ENTER_HOST --branch REPOSITORY_BRANCH
```
- "endpoint" is the Server host (BE) server.com is example; Once the validation pass, the call will be passed to BE. 
- "branch" is your workspace branch number

Linux: 
Download and Install nodeJS in your linux machine: https://nodejs.org/dist/v7.5.0/node-v7.5.0-linux-x64.tar.xz
```sh
$ mkdir sdk-datapower
$ cd sdk-datapower
#Download the project inside sdk-datapower
$ nohup node ./src/server.js --endpoint $HOSTNAME > logger.log /dev/null 2>&1 &
```

Server will Run in with port "40004" - it is configurable port.


### Configuration: 

You can config your workspace branch and Nexus in package.json file: 
``` sh
# branch: Your workspace branch (If no arg sent for server.js file - See above)
# nexus: Your nexus URL. (or GitHub)
```
You can see server runtime configuration under: src\configs.js
``` sh
# whitelistApis: Bypassed URLs
# passAPIOnFailure: Pass the REST even if there was failure (Failures will be logged)
# continueWithInvalidJson: Once JSON is not valid, Fail the REST call. 
# endpoint.port is the port for for the target Env (endpoint env)
```
You can change the REST base path under: src\validator\http_constants.js
``` sh
# Example in USCC, all of the RESTs are starting with "my-rests":
# http://<host>:><port>/my-rests/v1/example-rest
```

You can set the zipped JSONs packages names from nexus under: src\startup\nexus\constants.js
``` sh
# Example for my package: rest-api-name: 
files: [
        {
            name: 'rest-api-name',
            src: 'rest-api-name-${SNAPSHOT_VERSION}-json.zip',   
            trg: 'rest-api-name.zip'
        }
    ],
```
