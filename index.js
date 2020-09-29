
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser")
const fetch = require('node-fetch');
const fs = require('fs')
const port = 80;

const app = express();

var corsOptions = 
{
    "credentials": "true",
    "allowedHeaders": "origin, authorization, accept, content-type, x-requested-with",    
    "methods": "GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS",
    "origin": "*"    
}
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use((req, res, next) => {       
    console.log(req.originalUrl);
    next();
});

let url = "https://github.com";
let settings = { method: "GET" };

var configurations = [];
fetch(url, settings)
    .then(res => res.json())
    .then((json) => {
    });

fs.createReadStream('./configuration.json')
   .on('data', function(data){
      configurations.push(data);
   });


app.get("/Configuration/:environment", (req, res) => {        
    var environment;
    if (req.params.environment === "")
    {
        environment = "default";
    }
    else
    {
        environment = req.params.environment;
    }
    
    var configuration = configurations.filter(o => o.environment === environment);    
    res.send(configuration[0]);

});

app.listen(port, () => {
    console.log(`Express listening on at port ${port}`)
});