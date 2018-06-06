import { ConfigFileRepository } from "./config-file-repository";
import { CountFileRepository } from "./count-file-repository";
import { CountManager } from "./count-manager";
import { defaultConfig } from "./default-config";
import { ExecutionArgumentValidatorExecutorCombinationManager } from "./execution-argument-validator-executor-combination-manager";
import { FilePathExecutionArgumentValidator } from "./execution-argument-validators/file-path-execution-argument-validator";
import { ExecutionService } from "./execution-service";
import { FilePathExecutor } from "./executors/file-path-executor";
import { WebUrlExecutor } from "./executors/web-url-executor";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { WindowHelpers } from "./helpers/winow-helpers";
import { Injector } from "./injector";
import { InputValidationService } from "./input-validation-service";
import { InputValidatorSearcherCombinationManager } from "./input-validator-searcher-combination-manager";
import { VariableInputValidator } from "./input-validators/variable-input-validator";
import { IpcChannels } from "./ipc-channels";
import { MusicPlayerNowPlaying, NowPlayingPlayerName } from "./music-player-nowplaying";
import { MusicPlayerWebSocket } from "./music-player-websocket";
import { OperatingSystem } from "./operating-system";
import { SearchEngine } from "./search-engine";
import * as isInDevelopment from "electron-is-dev";
import { autoUpdater } from "electron-updater";
import * as fs from "fs";
import { PlayerName } from "nowplaying-node";
import { platform } from "os";
import * as path from "path";
import {
    app,
    BrowserWindow,
    globalShortcut,
    ipcMain,
    Menu,
    MenuItem,
    Tray,
    } from "electron";

let mainWindow: BrowserWindow;
let trayIcon: Tray;
const delayWhenHidingCommandlineOutputInMs = 25;

const filePathExecutor = new FilePathExecutor();

let config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();
let inputValidationService = new InputValidationService(new InputValidatorSearcherCombinationManager(config).getCombinations());
let executionService = new ExecutionService(
    new ExecutionArgumentValidatorExecutorCombinationManager(config).getCombinations(),
    new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

let playerConnectStatus: boolean = false;

const otherInstanceIsAlreadyRunning = app.makeSingleInstance(() => {
    // do nothing
});

if (otherInstanceIsAlreadyRunning) {
    app.quit();
} else {
    startApp();
}

function startApp(): void {
    app.on("ready", createMainWindow);
    app.on("window-all-closed", quitApp);
}

function createMainWindow(): void {
    hideAppInDock();

    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        center: true,
        frame: false,
        height: WindowHelpers.calculateMaxWindowHeight(config.userInputHeight, config.maxSearchResultCount, config.searchResultHeight),
        resizable: true,
        show: false,
        skipTaskbar: true,
        transparent: true,
        width: config.windowWith,
    });

    mainWindow.loadURL(`file://${__dirname}/../main.html`);
    mainWindow.setSize(config.windowWith, config.userInputHeight);

    mainWindow.on("close", quitApp);
    mainWindow.on("blur", hideMainWindow);

    createTrayIcon();
    registerGlobalShortCuts();
    const playerType = config.musicPlayerType.toLowerCase();
    if (playerType === "local") {
        createMusicPlayerNowPlaying();
    } else if (playerType === "websocket") {
        createMusicPlayerWebSocket();
    }

    if (!isInDevelopment) {
        checkForUpdates();
        setAutostartSettings();
    }
}

function createTrayIcon(): void {
    trayIcon = new Tray(Injector.getTrayIconPath(platform(), path.join(__dirname, "../")));
    trayIcon.setToolTip(UeliHelpers.productName);
    trayIcon.setContextMenu(Menu.buildFromTemplate([
        {
            click: toggleWindow,
            label: "Show/Hide",
        },
        {
            click: quitApp,
            label: "Exit",
        },
    ]));
}

function registerGlobalShortCuts(): void {
    globalShortcut.register("alt+space", toggleWindow);
}

function hideAppInDock(): void {
    if (platform() === "darwin") {
        app.dock.hide();
    }
}

function checkForUpdates(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.checkForUpdates();
}

function downloadUpdate(): void {
    autoUpdater.downloadUpdate();
    addUpdateStatusToTrayIcon("Downloading update...");
}

autoUpdater.on("update-available", (): void => {
    addUpdateStatusToTrayIcon("Download and install update", downloadUpdate);
});

autoUpdater.on("error", (): void => {
    addUpdateStatusToTrayIcon("Update check failed");
});

autoUpdater.on("update-not-available", (): void => {
    addUpdateStatusToTrayIcon(`${UeliHelpers.productName} is up to date`);
});

autoUpdater.on("update-downloaded", (): void => {
    autoUpdater.quitAndInstall();
});

function setAutostartSettings() {
    app.setLoginItemSettings({
        args: [],
        openAtLogin: config.autoStartApp,
        path: process.execPath,
    });
}

function addUpdateStatusToTrayIcon(label: string, clickHandler?: any): void {
    const updateItem = clickHandler === undefined
        ? { label }
        : { label, click: clickHandler } as MenuItem;

    trayIcon.setContextMenu(Menu.buildFromTemplate([
        updateItem,
        {
            click: toggleWindow,
            label: "Show/Hide",
        },
        {
            click: quitApp,
            label: "Exit",
        },
    ]));
}

function toggleWindow(): void {
    if (mainWindow.isVisible()) {
        hideMainWindow();
    } else {
        mainWindow.show();
    }
}

function updateWindowSize(searchResultCount: number): void {
    const musicPlayerHeight = playerConnectStatus ? config.musicPlayerHeight : 0;
    const newWindowHeight = WindowHelpers.calculateWindowHeight(searchResultCount, config.maxSearchResultCount, config.userInputHeight, config.searchResultHeight, musicPlayerHeight);
    mainWindow.setSize(config.windowWith, newWindowHeight);
}

function hideMainWindow(): void {
    mainWindow.webContents.send(IpcChannels.resetCommandlineOutput);
    mainWindow.webContents.send(IpcChannels.resetUserInput);

    setTimeout(() => {
        if (mainWindow !== null && mainWindow !== undefined) {
            updateWindowSize(0);
            mainWindow.hide();
        }
    }, delayWhenHidingCommandlineOutputInMs); // to give user input and command line output time to reset properly delay hiding window
}

function reloadApp(): void {
    config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();
    inputValidationService = new InputValidationService(new InputValidatorSearcherCombinationManager(config).getCombinations());
    executionService = new ExecutionService(
        new ExecutionArgumentValidatorExecutorCombinationManager(config).getCombinations(),
        new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

    mainWindow.reload();
    resetWindowToDefaultSizeAndPosition();
}

function resetWindowToDefaultSizeAndPosition(): void {
    mainWindow.setSize(config.windowWith, WindowHelpers.calculateMaxWindowHeight(config.userInputHeight, config.maxSearchResultCount, config.searchResultHeight));
    mainWindow.center();
    updateWindowSize(0);
}

function quitApp(): void {
    trayIcon.destroy();
    globalShortcut.unregisterAll();
    app.quit();
}

ipcMain.on(IpcChannels.hideWindow, hideMainWindow);
ipcMain.on(IpcChannels.ueliReload, reloadApp);
ipcMain.on(IpcChannels.ueliExit, quitApp);

ipcMain.on(IpcChannels.getSearch, (event: any, arg: string): void => {
    const userInput = arg;
    const result = inputValidationService.getSearchResult(userInput);
    updateWindowSize(result.length);
    event.sender.send(IpcChannels.getSearchResponse, result);
});

ipcMain.on(IpcChannels.execute, (event: any, arg: string): void => {
    const executionArgument = arg;
    executionService.execute(executionArgument);
});

ipcMain.on(IpcChannels.openFileLocation, (event: any, arg: string): void => {
    const filePath = arg;
    if (new FilePathExecutionArgumentValidator().isValidForExecution(filePath)) {
        filePathExecutor.openFileLocation(filePath);
    }
});

ipcMain.on(IpcChannels.autoComplete, (event: any, arg: string[]): void => {
    const userInput = arg[0];
    let executionArgument = arg[1];
    const dirSeparator = Injector.getDirectorySeparator(platform());

    if (new FilePathExecutionArgumentValidator().isValidForExecution(userInput)
     || new VariableInputValidator().isValidForSearchResults(userInput)) {
        if (!executionArgument.endsWith(dirSeparator) && fs.lstatSync(executionArgument).isDirectory()) {
            executionArgument = `${executionArgument}${dirSeparator}`;
        }

        event.sender.send(IpcChannels.autoCompleteResponse, executionArgument);
    }
});

ipcMain.on(IpcChannels.getSearchIcon, (event: any): void => {
    const iconManager = Injector.getIconManager(platform());
    event.sender.send(IpcChannels.getSearchIconResponse, iconManager.getSearchIcon());
});

ipcMain.on(IpcChannels.commandLineExecution, (arg: string): void => {
    mainWindow.webContents.send(IpcChannels.commandLineOutput, arg);
    updateWindowSize(config.maxSearchResultCount);
});

ipcMain.on(IpcChannels.resetUserInput, (): void => {
    mainWindow.webContents.send(IpcChannels.resetUserInput);
});

ipcMain.on(IpcChannels.showHelp, (): void => {
    new WebUrlExecutor().execute("https://github.com/oliverschwendener/ueli#ueli");
});

ipcMain.on(IpcChannels.playerConnectStatus, (event: any, arg: boolean): void => {
    playerConnectStatus = arg;
    updateWindowSize(0);
});

let websocketCrawler: MusicPlayerWebSocket;
function createMusicPlayerWebSocket() {
    websocketCrawler = new MusicPlayerWebSocket(config.musicPlayerWebSocketPort, infoSender);
    ipcMain.on(IpcChannels.playerNextTrack, () => websocketCrawler.sendCommand("next"));
    ipcMain.on(IpcChannels.playerPrevTrack, () => websocketCrawler.sendCommand("previous"));
    ipcMain.on(IpcChannels.playerPlayPause, () => websocketCrawler.sendCommand("playpause"));
    ipcMain.on(IpcChannels.playerLikeTrack, () => {
        const rating = `setrating ${websocketCrawler.rating.value === 5 ? 0 : 5}`;
        websocketCrawler.sendCommand(rating);
    });
}

let npCrawer: MusicPlayerNowPlaying;
function createMusicPlayerNowPlaying() {
    let player = 0;
    const name = config.musicPlayerLocalName.toLowerCase();
    if (name === "aimp") {
        player = PlayerName.AIMP;
    } else if (name === "cad") {
        player = PlayerName.CAD;
    } else if (name === "foobar") {
        player = PlayerName.FOOBAR;
    } else if (name === "itunes") {
        player = PlayerName.ITUNES;
    } else if (name === "mediamonkey") {
        player = PlayerName.MEDIAMONKEY;
    } else if (name === "spotify") {
        player = PlayerName.SPOTIFY;
    } else if (name === "winamp") {
        player = PlayerName.WINAMP;
    } else if (name === "wmp") {
        player = PlayerName.WMP;
    }
    npCrawer = new MusicPlayerNowPlaying(player, infoSender);
    ipcMain.on(IpcChannels.playerNextTrack, () => npCrawer.nextTrack());
    ipcMain.on(IpcChannels.playerPrevTrack, () => npCrawer.prevTrack());
    ipcMain.on(IpcChannels.playerPlayPause, () => npCrawer.playPause());
    ipcMain.on(IpcChannels.playerLikeTrack, () => {
        const rating = npCrawer.rating.value > 3 ? 0 : 5;
        npCrawer.setRating(rating);
    });
}

function infoSender(channel: string, value: any): void {
    mainWindow.webContents.send(channel, value);
}
