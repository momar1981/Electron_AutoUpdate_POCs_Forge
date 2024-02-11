window.ipcRenderer = require('electron').ipcRenderer;


window.CheckForUpdates = (isUpdateAvalible,downloadingImgPath) => 
{
    if(isUpdateAvalible)
    {
       document.write(`<html><head></head>
       <body style="background-color:black;display:flex;align-items:center;justify-content:center;flex-direction:column;height:100vh">
       <h2 style="color:#039be5"><b>New version downloding ...</b></h2>
       <img src="${downloadingImgPath}" />
       </body></html>`);
    }
}
