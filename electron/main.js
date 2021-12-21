const path = require('path');
const fs = require('fs');
const { w3cwebsocket } = require('websocket');

const { app, ipcMain, protocol, BrowserWindow } = require('electron');

const CONFIG_FILE = path.join(__dirname, "config.json");
const REACT_APP_LOCATION = `file://${path.join(__dirname, '../build/index.html')}`;

let isDev = false;
try {
    isDev = require('electron-is-dev');
} catch (e) {
    console.log("Running in production mode using react app at: " + REACT_APP_LOCATION);
}

let config = JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
let pingInterval;
let consumerInterval;
let ws;
let queue = [];
const connect = async (channelId) => {
    ws = new w3cwebsocket('wss://deusprogrammer.com/api/ws/twitch');
    
    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: "REGISTER_PANEL",
            from: "PANEL",
            name: "FILE_WRITER",
            channelId
        }));

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        pingInterval = setInterval(() => {
            ws.send(JSON.stringify({
                type: "PING_SERVER",
                from: "PANEL",
                name: "FILE_WRITER",
                channelId
            }));
        }, 20 * 1000);
    };

    ws.onmessage = async (message) => {
        let event = JSON.parse(message.data);

        if (!["FILE_WRITER"].includes(event.type)) {
            return;
        }

        console.log("Received: " + JSON.stringify(event, null, 5));

        queue.push(event);
    };

    ws.onclose = async (e) => {
        console.log('Socket is closed. Reconnect will be attempted in 5 second.', e.reason);
        setTimeout(async () => {
            connect();
        }, 5000);
    };

    ws.onerror = async (err) => {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };
}

const consumer = (config) => {
    if (queue.length <= 0) {
        return;
    }

    const {eventData: {fileToWriteTo, textToWrite}} = queue[0];
    queue = queue.slice(1);

    const {path} = config.fileTargets[fileToWriteTo];
    fs.writeFileSync(path, textToWrite);
}

let win;
const createWindow = async () => {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            webSecurity: false,
            preload: path.join(__dirname, "preload.js") // use a preload script
        },
    });

    // and load the index.html of the app.
    // win.loadFile("index.html");
    win.loadURL(
        isDev ? 'http://localhost:3000' :
        REACT_APP_LOCATION
    );

    protocol.interceptFileProtocol('app', function (request, callback) {
        let url = request.url.substr(6);
        let dir = path.normalize(path.join(__dirname, '.', url));
        callback(dir);
    }, function (err) {
        if (err) {
            console.error('Failed to register protocol');
        }
    });

    // Open the DevTools.
    if (isDev) {
        win.webContents.openDevTools({ mode: 'detach' });
    }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Create window
    createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Bridged functionality

ipcMain.handle('updateConfig', (event, newConfig) => {
    console.log("CONFIG: " + JSON.stringify(newConfig));
    config = newConfig;
    fs.writeFileSync(CONFIG_FILE, Buffer.from(JSON.stringify(config, null, 5)));
    return;
});

ipcMain.handle('getConfig', () => {
    return config;
});

ipcMain.handle('startProxy', () => {
    // Connect websocket
    connect(config.twitchChannelId);

    // Start the message pump
    consumerInterval = setInterval(() => {
        consumer(config);
    }, 1000);
});

ipcMain.handle('stopProxy', () => {
    ws.onmessage = () => {}
    ws.onclose = () => {}
    ws.onerror = () => {}
    ws.close();

    // Stop the message pump
    clearInterval(consumerInterval);
    clearInterval(pingInterval);
});