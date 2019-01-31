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
import { Icons } from "./icon-manager/icon-manager";
import { Injector } from "./injector";
import { InputValidationService } from "./input-validation-service";
import { InputValidatorSearcherCombinationManager } from "./input-validator-searcher-combination-manager";
import { IpcChannels } from "./ipc-channels";
import { WebSocketSearchResult } from "./music-player/websocket";
import { OnlineInputValidationService } from "./online-input-validation-service";
import { OnlineInputValidatorSearcherCombinationManager } from "./online-input-validator-searcher-combination-manager";
import { ProcessInputValidationService } from "./process-input-validation-service";
import { SearchResultItem } from "./search-result-item";
import { NativeUtil } from "./native-lib";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
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

const nbind = require("../../build/Release/nbind.node");
const nativeUtil: NativeUtil = new nbind.NativeUtil();

let config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

const globalUELI: GlobalUELI = {
    config,
    nativeUtil,
    onlinePluginCollection: [],
    runPluginCollection: [],
    taskbar: new Taskbar(),
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
        const plugins = nativeUtil.iterateFolder(extPluginPath);
        for (const plugin of plugins) {
            try {
                const obj = __non_webpack_require__(plugin.path());
                if (obj.runSearcher && obj.inputValidator) {
                    runCollection.push(obj as ExternalRunPlugin);
                } else if (obj.onlineSearcher && obj.inputValidator) {
                    onlineCollection.push(obj as ExternalOnlinePlugin);
                } else {
                    dialog.showErrorBox(
                        `Invalid plugin: ${plugin.name()}`,
                        "Cannot find runSeacher or onlineSeacher or inputValidator exports.");
                }
            } catch (error) {
                dialog.showErrorBox(`Cannot load plugin ${plugin}`, error.message);
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

let runIVS: InputValidationService;
let onlineIVS: OnlineInputValidationService;
let processIVS: ProcessInputValidationService;
let everythingIVS: EverythingInputValidationService;
let executionService: ExecutionService;
let isReady = false;
let currentWorkingDirectory: string | undefined;

async function loadSearcher() {
    isReady = false;
    const externalPlugins = getExternalPlugins();
    globalUELI.runPluginCollection = externalPlugins.runCollection;
    globalUELI.onlinePluginCollection = externalPlugins.onlineCollection;

    runIVS = new InputValidationService(
        new InputValidatorSearcherCombinationManager(globalUELI).getCombinations());

    onlineIVS = new OnlineInputValidationService(
        new OnlineInputValidatorSearcherCombinationManager(globalUELI).getCombinations());

    processIVS = new ProcessInputValidationService(config.useNativeApplicationIcon);
    processIVS.taskbar = globalUELI.taskbar;

    everythingIVS = new EverythingInputValidationService(globalUELI);

    executionService = new ExecutionService(
        new ExecutionArgumentValidatorExecutorCombinationManager(globalUELI).getCombinations(),
        new CountManager(new CountFileRepository(UeliHelpers.countFilePath)));

    isReady = true;
}

let playerConnectStatus: boolean = false;

app.on("ready", createMainWindow);
app.on("window-all-closed", quitApp);
app.requestSingleInstanceLock();

function createMainWindow(): void {
    loadSearcher();

    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        center: true,
        frame: false,
        height: WindowHelpers.calculateMaxWindowHeight(
            config.userInputHeight,
            config.maxSearchResultCount,
            config.searchResultHeight,
        ),
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
    trayIcon = new Tray(Injector.getTrayIconPath(path.join(__dirname, "../")));
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

    if (config.hotkeyRunModeCwd) {
        globalShortcut.register(config.hotkeyRunModeCwd, () => {
            changeModeWithHotkey(InputModes.RUN, true);
        });
    }

    if (config.hotkeyEverythingModeCwd) {
        globalShortcut.register(config.hotkeyEverythingModeCwd, () => {
            changeModeWithHotkey(InputModes.EVERYTHING, true);
        });
    }
}

function changeModeWithHotkey(mode: number, setCurrentWorkingDirectory = false) {
    const isVisible = mainWindow.isVisible();

    if (!isVisible) {
        nativeUtil.storeLastFgWindow();
        showMainWindow();
    }

    if (setCurrentWorkingDirectory) {
        let rawPath = nativeUtil.getExplorerPath();
        if (rawPath) {
            rawPath = decodeURI(rawPath)
                .replace("file:///", "").replace(/\//g, "\\");

            if (!rawPath.endsWith("\\")) {
                rawPath += "\\";
            }

            currentWorkingDirectory = rawPath;
        }
    } else {
        currentWorkingDirectory = undefined;
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

    mainWindow.webContents.send(IpcChannels.mainShow);
    mainWindow.restore();
    mainWindow.show();
}

function updateWindowSize(searchResultCount: number): void {
    const musicPlayerHeight = playerConnectStatus ? (config.musicPlayerSmallSize ? 140 : 300) : 0;
    const newWindowHeight = WindowHelpers.calculateWindowHeight(searchResultCount, config.maxSearchResultCount, config.userInputHeight, config.searchResultHeight, musicPlayerHeight);
    mainWindow.setSize(config.windowWidth, newWindowHeight);
}

function hideMainWindow(): void {
    mainWindow.webContents.send(IpcChannels.resetCommandlineOutput);
    mainWindow.webContents.send(IpcChannels.resetUserInput);

    if (mainWindow && mainWindow.isVisible()) {
        setTimeout(() => {
            updateWindowSize(0);
            mainWindow.setOpacity(0);
            mainWindow.minimize();
            mainWindow.hide();
        }, 100);
    }
}

function reloadApp(): void {
    config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();
    globalUELI.config = config;

    executionService.destruct();
    runIVS.destruct();
    onlineIVS.destruct();

    loadSearcher();

    mainWindow.reload();
    resetWindowToDefaultSizeAndPosition();
}

function resetWindowToDefaultSizeAndPosition(): void {
    mainWindow.setSize(config.windowWidth, WindowHelpers.calculateMaxWindowHeight(config.userInputHeight, config.maxSearchResultCount, config.searchResultHeight));
    mainWindow.center();
    updateWindowSize(0);
}

function quitApp(): void {
    isReady = false;
    executionService.destruct();
    runIVS.destruct();
    onlineIVS.destruct();

    globalUELI.taskbar.destruct();

    if (globalUELI.nativeUtil.free) {
        globalUELI.nativeUtil.free();
    }

    mainWindow.webContents.session.clearCache(() => {/**/});
    mainWindow.webContents.session.clearStorageData();

    trayIcon.destroy();
    globalShortcut.unregisterAll();
    app.quit();
}

function getSearch(userInput: string): void {
    if (!isReady) {
        return;
    }

    inputString = userInput;
    switch (inputMode) {
        case InputModes.RUN: {
            mainWindow.webContents.send(
                IpcChannels.getScopes,
                runIVS.getScopes(userInput),
            );

            runIVS.getSearchResult(userInput, currentWorkingDirectory)
                .then((results) => {
                    if (config.features.runModeSwitchTo) {
                        prependSwitchProcesses(results);
                    }

                    sendResult(results);
                });

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
            processIVS.getSearchResult(userInput)
                .then(sendResult);
            break;
        }
        case InputModes.EVERYTHING: {
            mainWindow.webContents.send(
                IpcChannels.getScopes,
                everythingIVS.getScopes(userInput),
            );
            setLoadingIcon();
            everythingIVS.getSearchResult(userInput, currentWorkingDirectory)
                .then((allResults) => {
                    sendResult(allResults);
                    setModeIcon();
                });
            break;
        }
    }
}

function prependSwitchProcesses(results: SearchResultItem[]): void {
    let index = 0;
    const procs = globalUELI.taskbar.getAllApps();
    const matchedProc = [] as Array<{ index: number; item: SearchResultItem }>;
    for (const result of results) {
        if (index > 4) {
            break;
        }

        if (!result.target) {
            index++;
            continue;
        }

        for (const proc of procs) {
            if (result.target !== proc.getProgramPath()) {
                continue;
            }

            const item = {
                breadCrumb: [proc.getWindowTitle() || proc.getProcessName()],
                executionArgument: `HWND:${proc.getHWND()}`,
                icon: result.icon,
                name: `Switch to ${result.name}`,
            };

            matchedProc.unshift({ index, item });
        }
        index++;
    }

    for (const matched of matchedProc) {
        results.splice(matched.index, 0, matched.item);
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
            mainWindow.webContents.send(IpcChannels.getSearchIconResponse, Icons.EVERYTHING);
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
    executionService.execute(arg, alternative, currentWorkingDirectory);
});

ipcMain.on(IpcChannels.setModeIcon, setModeIcon);

ipcMain.on(IpcChannels.setLoadingIcon, setLoadingIcon);

ipcMain.on(IpcChannels.commandLineExecution, (arg: string): void => {
    mainWindow.webContents.send(IpcChannels.commandLineOutput, arg);
    updateWindowSize(config.maxSearchResultCount);
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

ipcMain.on(IpcChannels.toggleDevTool, () => {
    mainWindow.webContents.toggleDevTools();
});
