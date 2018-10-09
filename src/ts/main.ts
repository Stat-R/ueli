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
import { InputModes } from "./input-modes";

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

const extPluginPath = path.join(homedir(), ".ueli/plugins");
function getExternalPlugins() {
    const runCollection = [] as ExternalRunPlugin[];
    const onlineCollection = [] as ExternalOnlinePlugin[];

    if (existsSync(extPluginPath)) {
        const pluginNameCollection = readdirSync(extPluginPath);
        for (const pluginName of pluginNameCollection) {
            try {
                const pluginFullPath = path.join(extPluginPath, pluginName);
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
        mkdirSync(extPluginPath);
    }

    return { runCollection, onlineCollection };
}

{
    const externalPlugins = getExternalPlugins();
    globalUELI.runPluginCollection = externalPlugins.runCollection;
    globalUELI.onlinePluginCollection = externalPlugins.onlineCollection;
}

let inputMode = 0;
let inputString = "";
let onlineInputTimeout: NodeJS.Timer | number | null = null;

const screenshotFile = path.join(homedir(), "acrylic.bmp");
let screenshotSize: Electron.Size | null = null;

function webSocketSearch(userInput: string): Promise<WebSocketSearchResult[]> {
    return new Promise((resolve) => {
        mainWindow.webContents.send(IpcChannels.searchWebsocket, userInput);
        ipcMain.on(IpcChannels.getWebsocketSearchResponse, (_: Event, arg: WebSocketSearchResult[]) => {
            resolve(arg);
        });
    });
}

let runIVS = new InputValidationService(
    new InputValidatorSearcherCombinationManager(globalUELI).getCombinations());

let onlineIVS = new OnlineInputValidationService(
    new OnlineInputValidatorSearcherCombinationManager(globalUELI).getCombinations());

let processIVS = new ProcessInputValidationService();

let everythingIVS = new EverythingInputValidationService(nativeUtil, config.maxTotalSearchResult, config.everythingFilterFilePath);

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

    if (config.blurBackground) {
        mainWindow.on("move", moveWindow);
    }

    mainWindow.on("show", () => {
        setTimeout(() => mainWindow.setOpacity(1), 50);
    });

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
            changeModeWithHotkey(InputModes.RUN);
        });
    }
    if (config.hotkeyWindowsMode) {
        globalShortcut.register(config.hotkeyWindowsMode, () => {
            changeModeWithHotkey(InputModes.WINDOWS);
        });
    }
    if (config.hotkeyOnlineMode) {
        globalShortcut.register(config.hotkeyOnlineMode, () => {
            changeModeWithHotkey(InputModes.ONLINE);
        });
    }
    if (config.hotkeyEverythingMode) {
        globalShortcut.register(config.hotkeyEverythingMode, () => {
            changeModeWithHotkey(InputModes.EVERYTHING);
        });
    }
}

function changeModeWithHotkey(mode: number) {
    const isVisible = mainWindow.isVisible();
    if (!isVisible) {
        showMainWindow();
    }

    if (isVisible && mode === inputMode) {
        hideMainWindow();
        return;
    }

    switchMode(mode, inputString);
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
    if (mainWindow && mainWindow.isVisible()) {
        updateWindowSize(0);
        mainWindow.setOpacity(0);
        mainWindow.minimize();
        mainWindow.hide();
    }

    destructTaskbar();

    mainWindow.webContents.send(IpcChannels.resetCommandlineOutput);
    mainWindow.webContents.send(IpcChannels.resetUserInput);
}

function reloadApp(): void {
    config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();
    globalUELI.config = config;

    executionService.destruct();
    runIVS.destruct();
    onlineIVS.destruct();

    const externalPlugins = getExternalPlugins();
    globalUELI.runPluginCollection = externalPlugins.runCollection;
    globalUELI.onlinePluginCollection = externalPlugins.onlineCollection;

    executionService = new ExecutionService(
        new ExecutionArgumentValidatorExecutorCombinationManager(globalUELI).getCombinations(),
        new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

    runIVS = new InputValidationService(
        new InputValidatorSearcherCombinationManager(globalUELI).getCombinations());

    onlineIVS = new OnlineInputValidationService(
        new OnlineInputValidatorSearcherCombinationManager(globalUELI).getCombinations());

    processIVS = new ProcessInputValidationService();

    everythingIVS = new EverythingInputValidationService(nativeUtil, config.maxTotalSearchResult, config.everythingFilterFilePath);

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
    runIVS.destruct();
    onlineIVS.destruct();
    destructTaskbar();

    mainWindow.webContents.session.clearCache(() => {/**/});
    mainWindow.webContents.session.clearStorageData();

    trayIcon.destroy();
    globalShortcut.unregisterAll();
    app.quit();
}

function getSearch(userInput: string): void {
    inputString = userInput;
    switch (inputMode) {
        case InputModes.RUN: {
            mainWindow.webContents.send(
                IpcChannels.getScopes,
                runIVS.getScopes(userInput),
            );

            runIVS.getSearchResult(userInput)
                .then(sendResult);

            break;
        }
        case InputModes.ONLINE: {
            if (onlineInputTimeout !== null) {
                clearTimeout(onlineInputTimeout as number);
            }

            mainWindow.webContents.send(
                IpcChannels.getScopes,
                onlineIVS.getScopes(userInput),
            );

            onlineInputTimeout = setTimeout(() => {
                setLoadingIcon();

                const result: SearchResultItem[] = [];
                Promise.all(onlineIVS.getSearchResult(userInput))
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
        case InputModes.WINDOWS: {
            if (taskbar === undefined) {
                taskbar = new Taskbar();
            }
            processIVS.taskbar = taskbar;
            sendResult(processIVS.getSearchResult(userInput));
            break;
        }
        case InputModes.EVERYTHING: {
            mainWindow.webContents.send(
                IpcChannels.getScopes,
                everythingIVS.getScopes(userInput),
            );
            setLoadingIcon();
            everythingIVS.getSearchResult(userInput)
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

function setLoadingIcon(): void {
    mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.LOADING);
}

function setModeIcon(): void {
    switch (inputMode) {
        case InputModes.RUN:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.SEARCH);
            break;
        case InputModes.ONLINE:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.ONLINE);
            break;
        case InputModes.WINDOWS:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.WINDOWS);
            break;
        case InputModes.EVERYTHING:
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, IconsWindowsSetting.DATAUSAGE);
            break;
    }
}

function switchMode(mode: number, userInput = "") {
    mainWindow.webContents.send(IpcChannels.getSearchResponse, null);
    mainWindow.webContents.send(IpcChannels.inputMode, mode);
    inputMode = mode;
    getSearch(userInput);
    setModeIcon();
}

ipcMain.on(IpcChannels.hideWindow, hideMainWindow);
ipcMain.on(IpcChannels.ueliReload, reloadApp);
ipcMain.on(IpcChannels.ueliExit, quitApp);

ipcMain.on(IpcChannels.getSearch, (_: Event, arg: string): void => getSearch(arg));

ipcMain.on(IpcChannels.execute, (_: Event, arg: string, alternative: boolean): void => {
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

ipcMain.on(IpcChannels.playerConnectStatus, (_: Event, arg: boolean): void => {
    playerConnectStatus = arg;
    if (mainWindow.getSize()[1] === config.userInputHeight) {
        updateWindowSize(0);
    }
});

ipcMain.on(IpcChannels.changeMode, (_: Event, arg: number, currentInput: string): void => {
    switchMode(arg, currentInput);
});

ipcMain.on(IpcChannels.elevatedExecute, (arg: string): void => {
    nativeUtil.elevateExecute(arg);
});

ipcMain.on(IpcChannels.rendererInit, moveWindow);

ipcMain.on(IpcChannels.activateContextMenu, (_: Event, arg: string) => {
    nativeUtil.activateContextMenu(arg);
});

ipcMain.on(IpcChannels.autoComplete, (_: Event, userInput: string, cavetPosition: number, selectingResult: SearchResultItem) => {
    let result: string[] = [];
    switch (inputMode) {
        case InputModes.RUN:
            result = runIVS.complete(userInput, cavetPosition, selectingResult);
            break;
        case InputModes.ONLINE:
            result = onlineIVS.complete(userInput, cavetPosition, selectingResult);
            break;
        case InputModes.EVERYTHING:
            result = everythingIVS.complete(userInput);
            break;
    }

    if (result.length > 0) {
        mainWindow.webContents.send(IpcChannels.autoCompleteResponse, result);
    }
});
