const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, autoUpdater } = require("electron");
const { globalShortcut } = require("electron/main");
const { handleInstallEvents } = require("./config/install.config");
const fs = require("fs");
const path = require("path");
const openAboutWindow = require("about-window").default;
const package = require('./package.json');
const log = require('./helpers/logger');

var win;
var isUpdateInProgress = false;

// Object.defineProperty(app, 'isPackaged', {
//   get() {
//     return true;
//   }
// });
// squirrel event handled and app will exit in 1000ms, so don't do anything else
if (handleInstallEvents(app)) return;

// Define custom protocol handler. Deep linking works on packaged versions of the application!
if (!app.isDefaultProtocolClient("EdaraOfflineElectronProtocol"))
  app.setAsDefaultProtocolClient("EdaraOfflineElectronProtocol");

// Force Single Instance Application
const gotTheLock = app.requestSingleInstanceLock();
if (gotTheLock) {
  app.on("second-instance", (e, argv) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
} else {
  app.quit();
  return;
}

var settings;
if (fs.existsSync(path.join(app.getAppPath(), "appsettings.json"))) {
  settings = JSON.parse(
    fs.readFileSync(path.join(app.getAppPath(), "appsettings.json"))
  );
}


function openAboutPanel() {
  let appSettings = require("./appsettings.json");
  const appVersion = appSettings.Version;
  const electronVersion = process.versions.electron;
  const nodeVersion = process.versions.node;
  const chromeVersion = process.versions.chrome;
  const windowUrl = appSettings.AppUrl;

  openAboutWindow({
    icon_path: path.resolve(__dirname, "./icon.png"),
    copyright: `<div><a href='https://edraksoftware.com/'>Powerd by Edrak Software</a></div><br/><div><a href='${windowUrl}'>${windowUrl}</a></div>`,
    homepage: windowUrl,
    product_name: "Edara",
    show_close_button: "Close",
    use_inner_html: true,
    use_version_info: [
      ["Application", package.version],
      ["Node", nodeVersion],
      ["Electron", electronVersion],
      ["Chrome", chromeVersion]
    ],
    css_path: [path.resolve(__dirname, "./style.css")]
  });
}

function createAppMenu(updatingVersion) 
{
  const menuTemplate = [
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload", visible: !updatingVersion },
        { role: "forceReload", visible: !updatingVersion },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "toggleFullScreen" }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Edara",
          click: openAboutPanel //app.showAboutPanel
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// this should be placed at top of main.js to handle setup events quickly
function createWindow(isAllowDevTool = false) {
  createAppMenu(false);
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    fullscreen: false,
    autoHideMenuBar: false,
    center: true,
    icon: path.join(app.getAppPath(), "favicon.ico"),
    webPreferences: {
      nodeIntegration: true, // is default value after Electron v5
      contextIsolation: false, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      devTools: isAllowDevTool,
      preload: `${__dirname}/autoupdate/update.js`
    },
    show: true
  });
  if (settings && settings.AppUrl) win.loadURL(settings.AppUrl);
  else app.quit();

  /* Set did-fail-load listener once */
  win.webContents.on(
    "did-fail-load",
    function (event, code, desc, url, isMainFrame) {
      // downloading a file will emit this event and log this to the console
      log("did-fail-load code : ", code);
      log("did-fail-load desc : ", desc);
      log("did-fail-load url : ", url);
      log("did-fail-load isMainFrame : ", isMainFrame);
      // if(url === settings.AppUrl)
      //     setTimeout(() => { win.loadURL(settings.AppUrl)}, 5000);
    }
  );

  win.webContents.setZoomFactor(1.0);

  win.webContents.on("zoom-changed", (_event, zoomDirection) => {
    var currentZoom = win.webContents.getZoomFactor();
    if (zoomDirection === "in" && currentZoom < 1.2)
      win.webContents.zoomFactor = currentZoom + 0.1;
    if (zoomDirection === "out" && currentZoom > 0.8)
      win.webContents.zoomFactor = currentZoom - 0.1;
  });

  //Add context-menu
  win.webContents.on("context-menu", function (_event, params) 
  {
    const ctxmenu = new Menu();
    ctxmenu.append(new MenuItem({ label: "Reload", role: "reload", visible: !isUpdateInProgress }));
    ctxmenu.append(
      new MenuItem({ label: "Force reload", role: "forcereload", visible: !isUpdateInProgress  })
    );
    ctxmenu.append(new MenuItem({ label: "Copy", role: "copy" }));
    if (params.isEditable) {
      ctxmenu.append(new MenuItem({ label: "Cut", role: "cut" }));
      ctxmenu.append(new MenuItem({ label: "Paste", role: "paste" }));
      ctxmenu.append(new MenuItem({ label: "Select all", role: "selectall" }));
      ctxmenu.append(new MenuItem({ label: "Undo", role: "undo" }));
      ctxmenu.append(new MenuItem({ label: "Redo", role: "redo" }));
    }
    ctxmenu.popup(win, params.x, params.y);
  });

  return win;
}

app.whenReady().then(() => {
  autoUpdater.checkForUpdates();

  win = createWindow(true);

  globalShortcut.register("CommandOrControl+Shift+I", () => {});

  globalShortcut.register(settings.DevToolsShortcut, () => {
    let currentUrl = win.webContents.getURL();
    win.close();
    win = createWindow(true);
    win.webContents.openDevTools();
    win.loadURL(currentUrl);
    win.on("close", function () {
      win.webContents.closeDevTools();
      app.quit();
    });
    win.webContents.on("devtools-closed", function () {
      let currentUrl = win.webContents.getURL();
      win.close();
      win = createWindow();
      win.loadURL(currentUrl);
    });
  });
});

app.on("activate", function (event, launchInfo) {
  if (BrowserWindow.getAllWindows().length === 0) win = createWindow();
});

app.on("window-all-closed", function () {
 app.quit();
});

app.on('quit',() => 
{
});

// Configure auto updater
let feedUrl = 'https://edarapublish.blob.core.windows.net:443/publicfilesforelectron/';
autoUpdater.setFeedURL({
  url: feedUrl
});

autoUpdater.on('update-available', () => {
  log("update-available...");
  isUpdateInProgress = true;
  if (win && !win.isDestroyed()) 
  {
    win.webContents.once('dom-ready', () => {
      win.webContents.executeJavaScript(`CheckForUpdates(${isUpdateInProgress},"${feedUrl}loading.gif");`);
    }); 

    // Block Ctrl+R, F5, and close button
    globalShortcut.register('CommandOrControl+R', () => {});
    globalShortcut.register('F5', () => {});
    win.on('close', (event) => {
      event.preventDefault();
    });
    createAppMenu(isUpdateInProgress);
  }
});

autoUpdater.on('update-downloaded', () => {
  log("update-downloaded...");

  // Allow Ctrl+R, F5, and close button
  globalShortcut.unregister('CommandOrControl+R');
  globalShortcut.unregister('F5');
  win.removeAllListeners('close');
  isUpdateInProgress = false;
  autoUpdater.quitAndInstall();
});