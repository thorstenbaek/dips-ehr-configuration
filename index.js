const express = require("express");
const cors = require("cors");
const fetch = require('node-fetch');
const Cache = require('medusajs');
const port = 80;
const cacheExpiration = 300000; // 5 minutes

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

async function Refresh()
{
    console.log("Refreshing configuration from json");

    configurations = [];
    environments = [];
    settings = [];

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
    //TODO consider moving caching here
    console.log(req.originalUrl);
    next();
});

async function GetConfiguration(environment)
{    
    await Refresh();

    var configuration = configurations.filter(o => o.environment === environment);    
    if (configuration.length == 0)
    {
        var configuration = configurations.filter(o => o.environment === "default");    
    }

    return configuration[0].settings;
}

app.get("/Configuration/:environment", (request, response) => {
    var environment = request.params.environment;
    if (environment === "")
    {
        environment = "default";
    }
    
    Cache.get(request.url, 
            (resolve, reject) => 
            {
                resolve(GetConfiguration(environment));
            }, 
            cacheExpiration)
        .then(result => {
            response.send(result);        
    });            
})

async function GetSetting(environment, setting)
{    
    await Refresh();

    var filteredForSetting = settings.filter(s => s.key === setting);     
    if (filteredForSetting.length == 1)
    {
        return filteredForSetting[0].value;
    }
    else
    {    
        var envIdx = environments.indexOf(environment);
        
        if (envIdx < 0)
        {
            environment = "default";
        }

        var filteredForEnvironment = filteredForSetting.filter(s => s.environment === environment);
        if (filteredForEnvironment.length > 0)
        {
            return filteredForEnvironment[0].value;
        }
        else
        {
            filteredForEnvironment = filteredForSetting.filter(s => s.environment === "default");
            if (filteredForEnvironment.length > 0)
            {
                return filteredForEnvironment[0].value;
            }
        }        
    }

    return "";
}

app.get("/Setting/:environment/:setting", (request, response) => {       
    Cache.get(request.url, 
        (resolve, reject) => 
        {
            resolve(GetSetting(
                request.params.environment,
                request.params.setting
            ));
        }, 
        cacheExpiration)
    .then(result => {
        console.log(result)
        response.send(result);
    });       
});

app.listen(port, () => {
    console.log(`Express listening on at port ${port}`)
});