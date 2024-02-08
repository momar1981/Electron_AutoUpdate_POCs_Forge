const { rmSync } = require("fs");
const path = require("path");

const appName = "Edara";
const companyName = "Edrak Software";
const icon = "favicon.ico";
const loadingGif = "loading.gif";

const iconPath = path.join(__dirname, "..", icon);
const macIconPath = path.join(__dirname, "..", "icon.icns");
const loadingGifPath = path.join(__dirname, "..", loadingGif);

module.exports = {
  packagerConfig: {
    name: appName,
    icon: iconPath,
    asar: false,
    win32metadata: {
      FileDescription: appName,
      OriginalFilename: appName,
      InternalName: appName,
      ProductName: appName,
      CompanyName: companyName
    },
    protocols:[
      {
        name: "EdaraOfflineElectronProtocol",
        schemas: ["EdaraOfflineElectronProtocol"]
      }
    ],
    ignore: [
      ".git",
      "env",
      // "node_modules",
      ".vscode",
      ".gitignore",
      "config/env.config.js",
      "config/forge.config.js",
      "README.md"
    ],
    platform: ["darwin", "win32"]
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "edara",
        copyright: companyName,
        loadingGif: loadingGifPath,
        setupIcon: iconPath,
        iconUrl: iconPath,
        title: appName,
        owners: [companyName],
        setupExe: `${appName}.exe`
      }
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        icon: macIconPath,
        name: appName
      }
    }
  ]
};
