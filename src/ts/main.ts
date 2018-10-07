import { ConfigFileRepository } from "./config-file-repository";
import { CountFileRepository } from "./count-file-repository";
import { CountManager } from "./count-manager";
import { defaultConfig } from "./default-config";
import { EverythingInputValidationService } from "./everything-validation-service";
import { ExecutionArgumentValidatorExecutorCombinationManager } from "./execution-argument-validator-executor-combination-manager";
import { ExecutionService } from "./execution-service";
import { ExternalOnlinePlugin, ExternalRunPlugin } from "./external-plugin";
import { GlobalUELI } from "./global-ueli";
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
    dialog,
} from "electron";

export enum InputMode {
    RUN,
    ONLINE,
    WINDOWS,
    EVERYTHING,
    TOTALMODE, // Number of modes
}

let mainWindow: BrowserWindow;
let trayIcon: Tray;

const nativeUtil = new NativeUtil();

let config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

let taskbar: Taskbar | undefined;

const globalUELI: GlobalUELI = {
    config,
    onlinePluginCollection: [],
    runPluginCollection: [],
    webSocketCommandSender: (url: string) => {
        mainWindow.webContents.send(IpcChannels.websocketPlayURL, url);
    },
    webSocketSearch,
};

const externalPluginFolderPath = path.join(homedir(), ".ueli/plugins");
function getExternalPlugins() {
    const runCollection = [] as ExternalRunPlugin[];
    const onlineCollection = [] as ExternalOnlinePlugin[];

    if (existsSync(externalPluginFolderPath)) {
        const pluginNameCollection = readdirSync(externalPluginFolderPath);
        for (const pluginName of pluginNameCollection) {
            try {
                const pluginFullPath = path.join(externalPluginFolderPath, pluginName);
                const obj = __non_webpack_require__(pluginFullPath);
                if (obj.runSearcher && obj.inputValidator) {
                    runCollection.push(obj as ExternalRunPlugin);
                } else if (obj.onlineSearcher && obj.inputValidator) {
                    onlineCollection.push(obj as ExternalOnlinePlugin);
                } else {
                    dialog.showErrorBox(
                        `Invalid plugin: ${pluginName}`,
                        "Cannot find runSeacher or onlineSeacher or inputValidator exports.");
                }
            } catch (error) {
                dialog.showErrorBox(`Cannot load plugin ${pluginName}`, error.message);
            }
        }
    } else {
        const dotUeliPath = path.join(homedir(), ".ueli");
        if (!existsSync(dotUeliPath)) {
            mkdirSync(dotUeliPath);
        }
        mkdirSync(externalPluginFolderPath);
    }

    return { runCollection, onlineCollection };
}

{
    const externalPlugins = getExternalPlugins();
    globalUELI.runPluginCollection = externalPlugins.runCollection;
    globalUELI.onlinePluginCollection = externalPlugins.onlineCollection;
}

let currentInputMode = 0;
let currentInputString = "";
let onlineInputTimeout: NodeJS.Timer | number | null = null;

const screenshotFile = path.join(homedir(), "acrylic.bmp");
let screenshotSize: Electron.Size | null = null;

function webSocketSearch(userInput: string): Promise<WebSocketSearchResult[]> {
    return new Promise((resolve) => {
        mainWindow.webContents.send(IpcChannels.searchWebsocket, userInput);
        ipcMain.on(IpcChannels.getWebsocketSearchResponse, (_event: Event, arg: WebSocketSearchResult[]) => {
            resolve(arg);
        });
    });
}

let inputValidationService = new InputValidationService(
    new InputValidatorSearcherCombinationManager(globalUELI).getCombinations());

let onlineInputValidationService = new OnlineInputValidationService(
    new OnlineInputValidatorSearcherCombinationManager(globalUELI).getCombinations());

let processInputValidationService = new ProcessInputValidationService();

let everythingInputValidationService = new EverythingInputValidationService(nativeUtil, config.maxTotalSearchResult, config.everythingFilterFilePath);

let executionService = new ExecutionService(
    new ExecutionArgumentValidatorExecutorCombinationManager(globalUELI).getCombinations(),
    new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

let playerConnectStatus: boolean = false;

app.on("ready", createMainWindow);
app.on("window-all-closed", quitApp);
app.requestSingleInstanceLock();

function createMainWindow(): void {
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

    mainWindow.loadURL(`file://${__dirname}/../main.html`);

    nativeUtil.storeBrowserHwnd();

    mainWindow.setSize(config.windowWidth, config.userInputHeight);

    mainWindow.on("close", quitApp);
    mainWindow.on("blur", hideMainWindow);

    mainWindow.on("move", moveWindow);
    mainWindow.on("show", () => {
        setTimeout(() => mainWindow.setOpacity(1), 50);
    });
    moveWindow();

    createTrayIcon();
    registerGlobalShortCuts();
    screenshotSize = require("electron").screen.getPrimaryDisplay().size;

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
    if (!isVisible) {
        showMainWindow();
    }

    if (isVisible && mode === currentInputMode) {
        hideMainWindow();
        return;
    }

    switchMode(mode, currentInputString);
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
        hideMainWindow();
    } else {
        showMainWindow();
    }
}

function showMainWindow(): void {
    if (config.blurBackground && screenshotSize) {
        nativeUtil.takeScreenshot(screenshotSize.width, screenshotSize.height, screenshotFile);
    }

    mainWindow.restore();
    mainWindow.show();
    mainWindow.webContents.send(IpcChannels.mainShow);
}

function updateWindowSize(searchResultCount: number): void {
    const musicPlayerHeight = playerConnectStatus ? (config.musicPlayerSmallSize ? 140 : 300) : 0;
    const newWindowHeight = WindowHelpers.calculateWindowHeight(searchResultCount, config.maxSearchResultCount, config.userInputHeight, config.searchResultHeight, musicPlayerHeight);
    mainWindow.setSize(config.windowWidth, newWindowHeight);
}

function hideMainWindow(): void {
    mainWindow.webContents.send(IpcChannels.resetCommandlineOutput);
    mainWindow.webContents.send(IpcChannels.resetUserInput);

    destructTaskbar();

    if (mainWindow !== null && mainWindow !== undefined && mainWindow.isVisible()) {
        updateWindowSize(0);
        mainWindow.minimize();
        mainWindow.hide();
        mainWindow.setOpacity(0);
    }
}

function reloadApp(): void {
    config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();
    globalUELI.config = config;

    executionService.destruct();
    inputValidationService.destruct();
    onlineInputValidationService.destruct();

    const externalPlugins = getExternalPlugins();
    globalUELI.runPluginCollection = externalPlugins.runCollection;
    globalUELI.onlinePluginCollection = externalPlugins.onlineCollection;

    executionService = new ExecutionService(
        new ExecutionArgumentValidatorExecutorCombinationManager(globalUELI).getCombinations(),
        new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

    inputValidationService = new InputValidationService(
        new InputValidatorSearcherCombinationManager(globalUELI).getCombinations());

    onlineInputValidationService = new OnlineInputValidationService(
        new OnlineInputValidatorSearcherCombinationManager(globalUELI).getCombinations());

    processInputValidationService = new ProcessInputValidationService();

    everythingInputValidationService = new EverythingInputValidationService(nativeUtil, config.maxTotalSearchResult, config.everythingFilterFilePath);

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
    executionService.destruct();
    inputValidationService.destruct();
    onlineInputValidationService.destruct();
    destructTaskbar();

    mainWindow.webContents.session.clearCache(() => {/**/});
    mainWindow.webContents.session.clearStorageData();

    trayIcon.destroy();
    globalShortcut.unregisterAll();
    app.quit();
}

function getSearch(userInput: string): void {
    currentInputString = userInput;
    switch (currentInputMode) {
        case InputMode.RUN: {
            mainWindow.webContents.send(
                IpcChannels.getScopes,
                inputValidationService.getScopes(userInput),
            );

            inputValidationService.getSearchResult(userInput)
                .then(sendResult);

            break;
        }
        case InputMode.ONLINE: {
            if (onlineInputTimeout !== null) {
                clearTimeout(onlineInputTimeout as number);
            }

            mainWindow.webContents.send(
                IpcChannels.getScopes,
                onlineInputValidationService.getScopes(userInput),
            );

            onlineInputTimeout = setTimeout(() => {
                setLoadingIcon();

                const result: SearchResultItem[] = [];
                Promise.all(onlineInputValidationService.getSearchResult(userInput))
                    .then((allResults) => {
                        allResults.forEach((field) => {
                            result.push(...field);
                        });

                        sendResult(result);

                        setModeIcon();
                        onlineInputTimeout = null;
                    });
            }, config.onlineModeDelay);
            break;
        }
        case InputMode.WINDOWS: {
            if (taskbar === undefined) {
                taskbar = new Taskbar();
            }
            processInputValidationService.taskbar = taskbar;
            sendResult(processInputValidationService.getSearchResult(userInput));
            break;
        }
        case InputMode.EVERYTHING: {
            mainWindow.webContents.send(
                IpcChannels.getScopes,
                everythingInputValidationService.getScopes(userInput),
            );
            setLoadingIcon();
            everythingInputValidationService.getSearchResult(userInput)
                .then((allResults) => {
                    sendResult(allResults);
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

function sendResult(results: SearchResultItem[]) {
    if (results.length > 100) {
        results.length = 100;
    }

    updateWindowSize(results.length);
    mainWindow.webContents.send(IpcChannels.getSearchResponse, results);
}

ipcMain.on(IpcChannels.hideWindow, hideMainWindow);
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
});

ipcMain.on(IpcChannels.activateContextMenu, (_event: Event, arg: string) => {
    nativeUtil.activateContextMenu(arg);
});

ipcMain.on(IpcChannels.autoComplete, (_event: Event, userInput: string, cavetPosition: number, selectingResult: SearchResultItem) => {
    let result: string[] = [];
    switch (currentInputMode) {
        case InputMode.RUN:
            result = inputValidationService.complete(userInput, cavetPosition, selectingResult);
            break;
        case InputMode.ONLINE:
            result = onlineInputValidationService.complete(userInput, cavetPosition, selectingResult);
            break;
    }

    if (result.length > 0) {
        mainWindow.webContents.send(IpcChannels.autoCompleteResponse, result);
    }
});
