import { app, BrowserWindow, ipcMain } from 'electron'
import ElectronGoogleOAuth2 from '@getstation/electron-google-oauth2'
import electronGoogleOauth from 'electron-google-oauth'

const fs = require('fs')
const { google } = require('googleapis')

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      // keep in sync with /quasar.conf.js > electron > nodeIntegration
      // (where its default value is "true")
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
const oAuth2Client = new google.auth.OAuth2(
  '289929619103-hf4vjiqaque1pc8nh8n76513bhnb25rq.apps.googleusercontent.com',
  'ktC3inRqt-7WpHAq0b-QvQCy',
  'urn:ietf:wg:oauth:2.0:oob')

ipcMain.on('getToken', () => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.settings.basic']
  })
  console.log(authUrl)
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.loadURL(authUrl)
})
ipcMain.on('changeSignature', async (event, args) => {
  try {
    console.log(args)
    const usertoken = args[0]
    const userinfo = args[1]
    const HTMLDATA = args[2]
    oAuth2Client.getToken(usertoken, async (err, token) => {
      try {
        if (err) {
          console.error('Error retrieving access token')
          event.returnValue = 'Error retrieving access token'
          return 0
        }
        await oAuth2Client.setCredentials(token)
        await updateSignature(oAuth2Client, HTMLDATA, userinfo.emailAddress)
      } catch (error) {
        console.err('Err')
      }
    })
    event.returnValue = 'success'
  } catch (error) {
    event.returnValue = 'failed'
    console.error('Err')
  }
})

function updateSignature (auth, newsignature, email) {
  try {
    const gmail = google.gmail({ version: 'v1', auth })
    gmail.users.settings.sendAs.update({
      userId: 'me',
      sendAsEmail: email,
      fields: 'signature',
      resource: {
        signature: newsignature
      }
    }, (err, res) => {
      if (err) {
        return console.log('The API returned an error: ' + err)
      } else {
        return console.log('Signautre is Updated.')
      }
    })
  } catch (error) {
    return console.err('Err.')
  }
}
