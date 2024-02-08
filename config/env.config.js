const { readFile, writeFile } = require("fs");
const { join } = require("path");
const fs = require("fs");

if (process.argv <= 2) return;
const env = process.argv[2];
const settingsFileName = `environment.${env}.json`;

let appSettingObj = {};

const envFilePath = join("./env", settingsFileName);
const outPath = join("./appsettings.json");

function  onFileOpend(err, data) 
{
  appSettingObj = JSON.parse(data); //now it an object

  //Update Version (1).
  // Step 1: Read the current version from the online file

  // Access the version property
  appSettingObj.Version = '1.0.0';
  appSettingObj.Environment = env;
  appSettingObj.LatestVersionUrl = 'https://raw.githubusercontent.com/momar1981/Electron_AutoUpdate_POCs_Forge/main/autoupdate/latest.json';
  appSettingObj.SetupFile = 'https://deploy-dev.getedara.com/edara_app_win64.zip';//'https://pwa-electron.edara.io/edara_app_win64.zip';
  
  // Now you can use the online version as needed
  writeFile(outPath, JSON.stringify(appSettingObj), "utf8", function (err) {
    if (err) throw err;
    console.log("complete");
  });

}

readFile(envFilePath, "utf8", onFileOpend);

process.env.AppEnv = env;
