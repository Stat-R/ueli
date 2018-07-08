import { ConfigFileRepository } from "./config-file-repository";
import { CountFileRepository } from "./count-file-repository";
import { CountManager } from "./count-manager";
import { defaultConfig } from "./default-config";
import { ExecutionArgumentValidatorExecutorCombinationManager } from "./execution-argument-validator-executor-combination-manager";
import { FilePathExecutionArgumentValidator } from "./execution-argument-validators/file-path-execution-argument-validator";
import { ExecutionService } from "./execution-service";
import { FilePathExecutor } from "./executors/file-path-executor";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { WindowHelpers } from "./helpers/winow-helpers";
import { Injector } from "./injector";
import { InputValidationService } from "./input-validation-service";
import { InputValidatorSearcherCombinationManager } from "./input-validator-searcher-combination-manager";
import { VariableInputValidator } from "./input-validators/variable-input-validator";
import { IpcChannels } from "./ipc-channels";
import { MusicPlayerNowPlaying } from "./music-player-nowplaying";
import { MusicPlayerWebSocket, WebSocketSearcher } from "./music-player-websocket";
import * as isInDevelopment from "electron-is-dev";
import * as fs from "fs";
import { PlayerName } from "nowplaying-node";
import { platform, homedir } from "os";
import * as path from "path";
import {
    app,
    BrowserWindow,
    globalShortcut,
    ipcMain,
    Menu,
    Tray,
    screen,
    } from "electron";
import * as childProcess from "child_process";
import { OnlineInputValidationService } from "./online-input-validation-service";
import { OnlineInputValidatorSearcherCombinationManager } from "./online-input-validator-searcher-combination-manager";
import { SearchResultItem } from "./search-result-item";
import { ConfigOptions } from "./config-options";
import { ProcessInputValidationService } from "./process-input-validation-service";
import { Icons } from "./icon-manager/icon-manager";
import { Taskbar } from "taskbar-node";
import { App } from "../../../taskbar-node/lib-types";
import { NativeUtil } from "../../native-util/native-util";

export interface GlobalUELI {
    config: ConfigOptions;
    webSocketCommandSender: (command: string) => void;
    bringAppToTop: (hwnd: number) => void;
    getAllApps: () => App[];
}

export enum InputMode {
    RUN,
    ONLINE,
    WINDOWS,
    TOTALMODE, // Number of modes
}

let mainWindow: BrowserWindow;
let trayIcon: Tray;
const delayWhenHidingCommandlineOutputInMs = 25;

let nativeUtil: NativeUtil;

const filePathExecutor = new FilePathExecutor();

let config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

const taskbar = new Taskbar();

const globalUELI: GlobalUELI = {
    bringAppToTop: taskbar.bringAppToTop.bind(taskbar),
    config,
    getAllApps: taskbar.getAllApps.bind(taskbar),
    webSocketCommandSender: () => {/* do nothing */},
};

function infoSender(channel: string, value: any): void {
    mainWindow.webContents.send(channel, value);
}

const playerType = config.musicPlayerType.toLowerCase();

let websocketCrawler: MusicPlayerWebSocket;
let webSocketSearch: WebSocketSearcher = (query: string) => new Promise((resolve) => resolve([]));
let npCrawer: MusicPlayerNowPlaying;

if (playerType === "local") {
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
} else if (playerType === "websocket") {
    websocketCrawler = new MusicPlayerWebSocket(config.musicPlayerWebSocketPort, infoSender);
    webSocketSearch = websocketCrawler.search.bind(websocketCrawler);
    globalUELI.webSocketCommandSender = websocketCrawler.playURL.bind(websocketCrawler);
    ipcMain.on(IpcChannels.playerNextTrack, () => websocketCrawler.sendCommand("next"));
    ipcMain.on(IpcChannels.playerPrevTrack, () => websocketCrawler.sendCommand("previous"));
    ipcMain.on(IpcChannels.playerPlayPause, () => websocketCrawler.sendCommand("playpause"));
    ipcMain.on(IpcChannels.playerLikeTrack, () => {
        const rating = `setrating ${websocketCrawler.rating.value === 5 ? 0 : 5}`;
        websocketCrawler.sendCommand(rating);
    });
}

let currentInputMode = 0;
let currentInputString = "";

let inputValidationService = new InputValidationService(
    new InputValidatorSearcherCombinationManager(config).getCombinations(), config.searchEngineThreshold);

const onlineInputValidationService = new OnlineInputValidationService(
    new OnlineInputValidatorSearcherCombinationManager(webSocketSearch).getCombinations());

const processInputValidationService = new ProcessInputValidationService(globalUELI.getAllApps, config.searchEngineThreshold);

let executionService = new ExecutionService(
    new ExecutionArgumentValidatorExecutorCombinationManager(globalUELI).getCombinations(),
    new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

let playerConnectStatus: boolean = false;

app.on("ready", createMainWindow);
app.on("window-all-closed", quitApp);

function createMainWindow(): void {
    hideAppInDock();

    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        center: true,
        frame: false,
        height: WindowHelpers.calculateMaxWindowHeight(config.userInputHeight, config.maxSearchResultCount, config.searchResultHeight),
        show: false,
        skipTaskbar: true,
        transparent: true,
        width: config.windowWith,
    });

    nativeUtil = new NativeUtil(mainWindow.getNativeWindowHandle().readUInt8(0));

    mainWindow.loadURL(`file://${__dirname}/../main.html`);
    mainWindow.setSize(config.windowWith, config.userInputHeight);

    mainWindow.on("close", quitApp);
    mainWindow.on("blur", () => hideMainWindow(false));

    mainWindow.on("move", moveWindow);
    mainWindow.on("show", () => {
        setTimeout(() => mainWindow.setOpacity(1), 100);
    });
    moveWindow();

    createTrayIcon();
    registerGlobalShortCuts();

    if (!isInDevelopment) {
        setAutostartSettings();
    }
}

function moveWindow() {
    const newPos = mainWindow.getPosition();
    mainWindow.webContents.send(IpcChannels.moveX, newPos[0]);
    mainWindow.webContents.send(IpcChannels.moveY, newPos[1]);
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
    globalShortcut.register(config.hotkeyRunMode, () => {
        changeModeWithHotkey(InputMode.RUN);
    });
    globalShortcut.register(config.hotkeyWindowsMode, () => {
        changeModeWithHotkey(InputMode.WINDOWS);
    });
    globalShortcut.register(config.hotkeyOnlineMode, () => {
        changeModeWithHotkey(InputMode.ONLINE);
    });
}

function changeModeWithHotkey(mode) {
    const isVisible = mainWindow.isVisible();
    if (isVisible && mode === currentInputMode) {
        hideMainWindow(true);
        return;
    }

    switchMode(mode);
    if (!isVisible) {
        nativeUtil.storeForegroundHwnd();
        showMainWindow();
    }
}

function hideAppInDock(): void {
    if (platform() === "darwin") {
        app.dock.hide();
    }
}

function setAutostartSettings() {
    app.setLoginItemSettings({
        args: [],
        openAtLogin: config.autoStartApp,
        path: process.execPath,
    });
}

const screenshotFile = path.join(homedir(), "acrylic.bmp");

function toggleWindow(): void {
    if (mainWindow.isVisible()) {
        hideMainWindow(true);
    } else {
        showMainWindow();
    }
}

function showMainWindow(): void {

    getSearch("");
    let magickExecute = "cmd /C magick";
    if (config.imageMagickPath) {
        magickExecute = `"${config.imageMagickPath}"`;
    }

    childProcess.exec(`${magickExecute} screenshot:[0] "${screenshotFile}"`, (err) => {
        if (!err) {
            mainWindow.webContents.send(IpcChannels.tookScreenshot, screenshotFile);
        } else {
            throw err;
        }
        mainWindow.show();
    });
}

function updateWindowSize(searchResultCount: number): void {
    const musicPlayerHeight = playerConnectStatus ? config.musicPlayerHeight : 0;
    const newWindowHeight = WindowHelpers.calculateWindowHeight(searchResultCount, config.maxSearchResultCount, config.userInputHeight, config.searchResultHeight, musicPlayerHeight);
    mainWindow.setSize(config.windowWith, newWindowHeight);
}

function hideMainWindow(focusLastActiveWindow = false): void {
    mainWindow.webContents.send(IpcChannels.resetCommandlineOutput);
    mainWindow.webContents.send(IpcChannels.resetUserInput);

    setTimeout(() => {
        if (mainWindow !== null && mainWindow !== undefined && mainWindow.isVisible()) {
            updateWindowSize(0);
            mainWindow.hide();
            mainWindow.setOpacity(0);
            if (focusLastActiveWindow) {
                nativeUtil.activateLastActiveHwnd();
            }
        }
    }, delayWhenHidingCommandlineOutputInMs); // to give user input and command line output time to reset properly delay hiding window
}

function reloadApp(): void {
    config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();
    globalUELI.config = config;
    executionService = new ExecutionService(
        new ExecutionArgumentValidatorExecutorCombinationManager(globalUELI).getCombinations(),
        new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

    inputValidationService = new InputValidationService(
        new InputValidatorSearcherCombinationManager(config).getCombinations(), config.searchEngineThreshold);

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

ipcMain.on(IpcChannels.hideWindow, (event: any, arg: boolean) => hideMainWindow(arg));
ipcMain.on(IpcChannels.ueliReload, reloadApp);
ipcMain.on(IpcChannels.ueliExit, quitApp);

ipcMain.on(IpcChannels.getSearch, (event: any, arg: string) => getSearch(arg));

function getSearch(userInput: string): void {
    currentInputString = userInput;
    let result: SearchResultItem[] = [];
    switch (currentInputMode) {
        case InputMode.RUN: {
            Promise.all(inputValidationService.getSearchResult(userInput))
                .then((resultsArray) => {
                    result = resultsArray.reduce((acc, curr) => {
                        acc.push(...curr);
                        return acc;
                    }, [] as SearchResultItem[]);

                    updateWindowSize(result.length);
                    mainWindow.webContents.send(IpcChannels.getSearchResponse, result);
                });
            break;
        }
        case InputMode.ONLINE: {
            setLoadingIcon();
            Promise.all(onlineInputValidationService.getSearchResult(userInput))
                .then((allResults) => {
                    allResults.forEach((field) => {
                        result.push(...field);
                    });

                    updateWindowSize(result.length);
                    if (result.length > 0) {
                        mainWindow.webContents.send(IpcChannels.getSearchResponse, result);
                    }
                    setSearchIcon();
                });
            break;
        }
        case InputMode.WINDOWS: {
            result = processInputValidationService.getSearchResult(userInput);
            updateWindowSize(result.length);
            mainWindow.webContents.send(IpcChannels.getSearchResponse, result);
            break;
        }
    }
}

ipcMain.on(IpcChannels.execute, (event: any, arg: string, alternative: boolean): void => {
    executionService.execute(arg, alternative);
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

ipcMain.on(IpcChannels.getSearchIcon, setSearchIcon);

ipcMain.on(IpcChannels.commandLineExecution, (arg: string): void => {
    mainWindow.webContents.send(IpcChannels.commandLineOutput, arg);
    updateWindowSize(config.maxSearchResultCount);
});

ipcMain.on(IpcChannels.resetUserInput, (): void => {
    mainWindow.webContents.send(IpcChannels.resetUserInput);
});

ipcMain.on(IpcChannels.playerConnectStatus, (event: any, arg: boolean): void => {
    playerConnectStatus = arg;
    updateWindowSize(0);
});

function setLoadingIcon(): void {
    mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.LOADING);
}

function setSearchIcon(): void {
    switch (currentInputMode) {
        case InputMode.RUN:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.SEARCH);
            break;
        case InputMode.ONLINE:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.ONLINE);
            break;
        case InputMode.WINDOWS:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.WINDOWS);
            break;
    }
}

ipcMain.on(IpcChannels.switchMode, (event: any, mode: number, currentInput: string): void => switchMode(mode, currentInput));

function switchMode(mode: number, userInput = "") {
    mainWindow.webContents.send(IpcChannels.getSearchResponse, []);
    currentInputMode = mode;
    getSearch(userInput);
    setSearchIcon();
}

ipcMain.on(IpcChannels.rotateMode, (event: any, arg: number, currentInput: string): void => {
    let newMode = currentInputMode + arg;
    if (newMode < 0) {
        newMode = InputMode.TOTALMODE - 1;
    } else {
        newMode = newMode % InputMode.TOTALMODE;
    }
    switchMode(newMode, currentInput);
});

ipcMain.on(IpcChannels.elevatedExecute, (arg: string): void => {
    nativeUtil.elevateExecute(arg);
});
