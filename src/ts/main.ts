import { ConfigFileRepository } from "./config-file-repository";
import { ConfigOptions } from "./config-options";
import { CountFileRepository } from "./count-file-repository";
import { CountManager } from "./count-manager";
import { defaultConfig } from "./default-config";
import { EverythingInputValidationService } from "./everything-validation-service";
import { ExecutionArgumentValidatorExecutorCombinationManager } from "./execution-argument-validator-executor-combination-manager";
import { ExecutionService } from "./execution-service";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { WindowHelpers } from "./helpers/winow-helpers";
import { Icons, IconsWindowsSetting } from "./icon-manager/icon-manager";
import { Injector } from "./injector";
import { InputValidationService } from "./input-validation-service";
import { InputValidatorSearcherCombinationManager } from "./input-validator-searcher-combination-manager";
import { IpcChannels } from "./ipc-channels";
import { WebSocketSearchResult } from "./music-player/music-player-websocket";
import { OnlineInputValidationService } from "./online-input-validation-service";
import { OnlineInputValidatorSearcherCombinationManager } from "./online-input-validator-searcher-combination-manager";
import { ProcessInputValidationService } from "./process-input-validation-service";
import { SearchResultItem } from "./search-result-item";
import { NativeUtil } from "../../native-util/native-util";
import * as childProcess from "child_process";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { homedir, platform } from "os";
import * as path from "path";
import { Taskbar } from "taskbar-node";
import {
    app,
    BrowserWindow,
    Event,
    globalShortcut,
    ipcMain,
    Menu,
    Tray,
} from "electron";

export interface GlobalUELI {
    config: ConfigOptions;
    externalPluginCollection: any[];
    webSocketCommandSender: (command: string) => void;
    webSocketSearch: (input: string) => Promise<WebSocketSearchResult[]>;
}

export enum InputMode {
    RUN,
    ONLINE,
    WINDOWS,
    EVERYTHING,
    TOTALMODE, // Number of modes
}

let mainWindow: BrowserWindow;
let trayIcon: Tray;
const delayWhenHidingCommandlineOutputInMs = 25;

let nativeUtil = new NativeUtil();

let config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

let taskbar: Taskbar | undefined;

const globalUELI: GlobalUELI = {
    config,
    externalPluginCollection: [],
    webSocketCommandSender: (url: string) => {
        mainWindow.webContents.send(IpcChannels.websocketPlayURL, url);
    },
    webSocketSearch,
};

const externalPluginFolderPath = path.join(homedir(), ".ueli/extensions");
function getExternalPlugins() {
    const collection = [];
    if (existsSync(externalPluginFolderPath)) {
        try {
            const pluginNameCollection = readdirSync(externalPluginFolderPath);
            for (const pluginName of pluginNameCollection) {
                const pluginFullPath = path.join(externalPluginFolderPath, pluginName);
                const obj = __non_webpack_require__(pluginFullPath);
                if (obj.searcher && obj.inputValidator) {
                    collection.push(obj);
                }
            }
        } catch {
            // Nah
        }
    } else {
        mkdirSync(externalPluginFolderPath);
    }

    return collection;
}
globalUELI.externalPluginCollection = getExternalPlugins();

let currentInputMode = 0;
let currentInputString = "";
let onlineInputTimeout: NodeJS.Timer | undefined;

function webSocketSearch(userInput: string): Promise<WebSocketSearchResult[]> {
    return new Promise((resolve) => {
        mainWindow.webContents.send(IpcChannels.searchWebsocket, userInput);
        ipcMain.on(IpcChannels.getWebsocketSearchResponse, (_event: Event, arg: WebSocketSearchResult[]) => {
            resolve(arg);
        });
    });
}

let inputValidationService = new InputValidationService(
    new InputValidatorSearcherCombinationManager(globalUELI).getCombinations(), config.searchEngineThreshold);

let onlineInputValidationService = new OnlineInputValidationService(
    new OnlineInputValidatorSearcherCombinationManager(globalUELI).getCombinations());

let processInputValidationService = new ProcessInputValidationService(config.searchEngineThreshold);

let everythingInputValidationService = new EverythingInputValidationService(nativeUtil, config.everythingMaxResults, config.everythingFilterFilePath);

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
        maximizable: false,
        show: false,
        skipTaskbar: true,
        transparent: true,
        width: config.windowWidth,
    });

    nativeUtil.storeBrowserHwnd();

    mainWindow.loadURL(`file://${__dirname}/../main.html`);
    mainWindow.setSize(config.windowWidth, config.userInputHeight);

    mainWindow.on("close", quitApp);
    mainWindow.on("blur", () => hideMainWindow(false));

    mainWindow.on("move", moveWindow);
    mainWindow.on("show", () => {
        setTimeout(() => mainWindow.setOpacity(1), 50);
    });
    moveWindow();

    createTrayIcon();
    registerGlobalShortCuts();

    if (process.env.NODE_ENV !== "production") {
        setAutostartSettings();
    }
}

function moveWindow(): void {
    const newPos = mainWindow.getPosition();
    mainWindow.webContents.send(IpcChannels.onMove, newPos);
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
    if (config.hotkeyRunMode) {
        globalShortcut.register(config.hotkeyRunMode, () => {
            changeModeWithHotkey(InputMode.RUN);
        });
    }
    if (config.hotkeyWindowsMode) {
        globalShortcut.register(config.hotkeyWindowsMode, () => {
            changeModeWithHotkey(InputMode.WINDOWS);
        });
    }
    if (config.hotkeyOnlineMode) {
        globalShortcut.register(config.hotkeyOnlineMode, () => {
            changeModeWithHotkey(InputMode.ONLINE);
        });
    }
    if (config.hotkeyEverythingMode) {
        globalShortcut.register(config.hotkeyEverythingMode, () => {
            changeModeWithHotkey(InputMode.EVERYTHING);
        });
    }
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

    destructTaskbar()

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
    globalUELI.externalPluginCollection.length = 0;
    globalUELI.externalPluginCollection = getExternalPlugins();

    executionService = new ExecutionService(
        new ExecutionArgumentValidatorExecutorCombinationManager(globalUELI).getCombinations(),
        new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

    inputValidationService = new InputValidationService(
        new InputValidatorSearcherCombinationManager(globalUELI).getCombinations(), config.searchEngineThreshold);

    onlineInputValidationService = new OnlineInputValidationService(
        new OnlineInputValidatorSearcherCombinationManager(globalUELI).getCombinations());

    processInputValidationService = new ProcessInputValidationService(config.searchEngineThreshold);

    everythingInputValidationService = new EverythingInputValidationService(nativeUtil, config.everythingMaxResults, config.everythingFilterFilePath);

    destructTaskbar();

    mainWindow.reload();
    resetWindowToDefaultSizeAndPosition();
}

function resetWindowToDefaultSizeAndPosition(): void {
    mainWindow.setSize(config.windowWidth, WindowHelpers.calculateMaxWindowHeight(config.userInputHeight, config.maxSearchResultCount, config.searchResultHeight));
    mainWindow.center();
    updateWindowSize(0);
}

function quitApp(): void {
    destructTaskbar();
    trayIcon.destroy();
    globalShortcut.unregisterAll();
    app.quit();
}

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
            if (onlineInputTimeout !== undefined) {
                clearTimeout(onlineInputTimeout);
            }
            onlineInputTimeout = setTimeout(() => {
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
                        setModeIcon();
                        onlineInputTimeout = undefined;
                    });
            }, 500);
            break;
        }
        case InputMode.WINDOWS: {
            if (taskbar === undefined) {
                taskbar = new Taskbar();
            }
            processInputValidationService.taskbar = taskbar;
            result = processInputValidationService.getSearchResult(userInput);
            updateWindowSize(result.length);
            mainWindow.webContents.send(IpcChannels.getSearchResponse, result);
            break;
        }
        case InputMode.EVERYTHING: {
            setLoadingIcon();
            everythingInputValidationService.getSearchResult(userInput)
                .then((allResults) => {
                    updateWindowSize(allResults.length);
                    mainWindow.webContents.send(IpcChannels.getSearchResponse, allResults);
                    setModeIcon();
                });
            break;
        }
    }
}

function destructTaskbar() {
    if (taskbar !== undefined) {
        taskbar.destruct();
        taskbar = undefined;
    }
}

ipcMain.on(IpcChannels.hideWindow, (_event: Event, arg: boolean) => hideMainWindow(arg));
ipcMain.on(IpcChannels.ueliReload, reloadApp);
ipcMain.on(IpcChannels.ueliExit, quitApp);

ipcMain.on(IpcChannels.getSearch, (_event: Event, arg: string) => getSearch(arg));

ipcMain.on(IpcChannels.execute, (_event: Event, arg: string, alternative: boolean): void => {
    executionService.execute(arg, alternative);
});

ipcMain.on(IpcChannels.setModeIcon, setModeIcon);

ipcMain.on(IpcChannels.setLoadingIcon, setLoadingIcon);

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

function setModeIcon(): void {
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
        case InputMode.EVERYTHING:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, IconsWindowsSetting.DATAUSAGE);
            break;
    }
}

ipcMain.on(IpcChannels.switchMode, (_event: Event, mode: number, currentInput: string): void => switchMode(mode, currentInput));

function switchMode(mode: number, userInput = "") {
    mainWindow.webContents.send(IpcChannels.getSearchResponse, []);
    currentInputMode = mode;
    getSearch(userInput);
    setModeIcon();
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

ipcMain.on(IpcChannels.activateContextMenu, (_event: Event, arg: string) => {
    nativeUtil.activateContextMenu(arg);
});