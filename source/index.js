const {app, BrowserWindow} = require('electron')

const path = require('path')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: true,
    show: false,
    icon: path.join(__dirname, 'source', 'icon.png'),
    autoHideMenuBar: true
  })

  mainWindow.loadFile(path.join('source', 'index.html'))

  // mainWindow.setMenu(null)

  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show()
  })
}

app.disableHardwareAcceleration()

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
