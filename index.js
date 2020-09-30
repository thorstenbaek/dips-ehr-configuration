const express = require("express");
const cors = require("cors");
const fetch = require('node-fetch');
const port = 80;

const app = express();

let configurations = [];
let environments = [];
let settings = [];

function FlattenSettings()
{
    configurations.forEach(configuration => {
        Object.keys(configuration.settings).forEach(key => {
            settings.push(
            {                
                environment: configuration.environment,
                key: key,
                value: configuration.settings[key]
            }
        )});
    });
}

function ExtractEnvironments()
{
    configurations.forEach(configuration => {
        environments.push(configuration.environment);
    });
}

async function LoadConfiguration()
{
    let url = "https://raw.githubusercontent.com/thorstenbaek/dips-ehr-configuration/master/configuration.json";
    
    const response = await fetch(url);
    const data = await response.json();
    
    data.configurations.forEach(configuration => {
        configurations.push(configuration);            
    });

    ExtractEnvironments();
    FlattenSettings();
}

var corsOptions = 
{
    "credentials": "true",
    "allowedHeaders": "origin, authorization, accept, content-type, x-requested-with",    
    "methods": "GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS",
    "origin": "*"    
}
app.use(cors(corsOptions));

app.use((req, res, next) => {       
    console.log(req.originalUrl);
    next();
});

LoadConfiguration();

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
    if (configuration.length == 0)
    {
        var configuration = configurations.filter(o => o.environment === "default");    
    }
    
    res.send(configuration[0].settings);
});

app.get("/Setting/:environment/:setting", (req, res) => {
    var result = "";
    var setting = req.params.setting;    

    var filteredForSetting = settings.filter(s => s.key === setting);     
    if (filteredForSetting.length == 1)
    {
        result = filteredForSetting[0].value;
    }
    else
    {
        var environment = req.params.environment;
        var envIdx = environments.indexOf(environment);
        
        if (envIdx < 0)
        {
            environment = "default";
        }

        var filteredForEnvironment = filteredForSetting.filter(s => s.environment === environment);
        if (filteredForEnvironment.length > 0)
        {
            result = filteredForEnvironment[0].value;
        }
        else
        {
            filteredForEnvironment = filteredForSetting.filter(s => s.environment === "default");
            if (filteredForEnvironment.length > 0)
            {
                result = filteredForEnvironment[0].value;
            }
        }        
    }

    console.log(result)
    res.send(result);
});

app.listen(port, () => {
    console.log(`Express listening on at port ${port}`)
});