import { ConfigFileRepository } from "./config-file-repository";
import { CountFileRepository } from "./count-file-repository";
import { CountManager } from "./count-manager";
import { defaultConfig } from "./default-config";
import { ExecutionArgumentValidatorExecutorCombinationManager } from "./execution-argument-validator-executor-combination-manager";
import { ExecutionService } from "./execution-service";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { WindowHelpers } from "./helpers/winow-helpers";
import { Injector } from "./injector";
import { InputValidationService } from "./input-validation-service";
import { InputValidatorSearcherCombinationManager } from "./input-validator-searcher-combination-manager";
import { IpcChannels } from "./ipc-channels";
import * as isInDevelopment from "electron-is-dev";
import { platform, homedir } from "os";
import * as path from "path";
import {
    app,
    BrowserWindow,
    Event,
    globalShortcut,
    ipcMain,
    Menu,
    Tray,
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
import { WebSocketSearchResult } from "./music-player-websocket";

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

let config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

const taskbar = new Taskbar();

const globalUELI: GlobalUELI = {
    bringAppToTop: taskbar.bringAppToTop.bind(taskbar),
    config,
    getAllApps: taskbar.getAllApps.bind(taskbar),
    webSocketCommandSender: (url: string) => {
        mainWindow.webContents.send(IpcChannels.websocketPlayURL, url);
    },
};

let currentInputMode = 0;
let currentInputString = "";

function webSocketSearch(userInput: string): Promise<WebSocketSearchResult[]> {
    return new Promise((resolve) => {
        mainWindow.webContents.send(IpcChannels.searchWebsocket, userInput);
        ipcMain.on(IpcChannels.getWebsocketSearchResponse, (_event: Event, arg: WebSocketSearchResult[]) => {
            resolve(arg);
        });
    });
}

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
        width: config.windowWidth,
    });

    nativeUtil = new NativeUtil(mainWindow.getNativeWindowHandle().readUInt8(0));

    mainWindow.loadURL(`file://${__dirname}/../main.html`);
    mainWindow.setSize(config.windowWidth, config.userInputHeight);

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

function changeModeWithHotkey(mode: number) {
    const isVisible = mainWindow.isVisible();
    if (isVisible && mode === currentInputMode) {
        hideMainWindow(true);
        return;
    }

    switchMode(mode, currentInputString);
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

function toggleWindow(): void {
    if (mainWindow.isVisible()) {
        hideMainWindow(true);
    } else {
        showMainWindow();
    }
}

const screenshotFile = path.join(homedir(), "acrylic.bmp");

let magickExecute = "cmd /C magick";
if (config.imageMagickPath) {
    if (config.imageMagickPath === "no") {
        magickExecute = "no";
    } else {
        magickExecute = `"${config.imageMagickPath}"`;
    }
}

function showMainWindow(): void {
    getSearch("");
    if (magickExecute === "no") {
        mainWindow.show();
        mainWindow.webContents.send(IpcChannels.mainShow);
        return;
    }

    childProcess.exec(`${magickExecute} screenshot:[0] "${screenshotFile}"`, (err) => {
        if (!err) {
            mainWindow.webContents.send(IpcChannels.tookScreenshot, screenshotFile);
        } else {
            throw err;
        }
        mainWindow.show();
        mainWindow.webContents.send(IpcChannels.mainShow);
    });
}

function updateWindowSize(searchResultCount: number): void {
    const musicPlayerHeight = playerConnectStatus ? config.musicPlayerHeight : 0;
    const newWindowHeight = WindowHelpers.calculateWindowHeight(searchResultCount, config.maxSearchResultCount, config.userInputHeight, config.searchResultHeight, musicPlayerHeight);
    mainWindow.setSize(config.windowWidth, newWindowHeight);
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
    mainWindow.setSize(config.windowWidth, WindowHelpers.calculateMaxWindowHeight(config.userInputHeight, config.maxSearchResultCount, config.searchResultHeight));
    mainWindow.center();
    updateWindowSize(0);
}

function quitApp(): void {
    trayIcon.destroy();
    globalShortcut.unregisterAll();
    app.quit();
}

ipcMain.on(IpcChannels.hideWindow, (_event: Event, arg: boolean) => hideMainWindow(arg));
ipcMain.on(IpcChannels.ueliReload, reloadApp);
ipcMain.on(IpcChannels.ueliExit, quitApp);

ipcMain.on(IpcChannels.getSearch, (_event: Event, arg: string) => getSearch(arg));

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

ipcMain.on(IpcChannels.execute, (_event: Event, arg: string, alternative: boolean): void => {
    executionService.execute(arg, alternative);
});

ipcMain.on(IpcChannels.getSearchIcon, setSearchIcon);

ipcMain.on(IpcChannels.commandLineExecution, (arg: string): void => {
    mainWindow.webContents.send(IpcChannels.commandLineOutput, arg);
    updateWindowSize(config.maxSearchResultCount);
});

ipcMain.on(IpcChannels.resetUserInput, (): void => {
    mainWindow.webContents.send(IpcChannels.resetUserInput);
});

ipcMain.on(IpcChannels.playerConnectStatus, (_event: Event, arg: boolean): void => {
    playerConnectStatus = arg;
    if (mainWindow.getSize()[1] === config.userInputHeight) {
        updateWindowSize(0);
    }
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

ipcMain.on(IpcChannels.switchMode, (_event: Event, mode: number, currentInput: string): void => switchMode(mode, currentInput));

function switchMode(mode: number, userInput = "") {
    mainWindow.webContents.send(IpcChannels.getSearchResponse, []);
    currentInputMode = mode;
    getSearch(userInput);
    setSearchIcon();
}

ipcMain.on(IpcChannels.rotateMode, (_event: Event, arg: number, currentInput: string): void => {
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

ipcMain.on(IpcChannels.rendererInit, (): void => {
    moveWindow();
    mainWindow.webContents.send(IpcChannels.tookScreenshot, screenshotFile);
});
