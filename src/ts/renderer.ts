import { ConfigFileRepository } from "./config-file-repository";
import { defaultConfig } from "./default-config";
import { FilePathExecutionArgumentValidator } from "./execution-argument-validators/file-path-execution-argument-validator";
import { FilePathExecutor } from "./executors/file-path-executor";
import { Hotkey } from "./helpers/hotkey";
import { StringHelpers } from "./helpers/string-helpers";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { IconManager } from "./icon-manager/icon-manager";
import { IpcChannels } from "./ipc-channels";
import { MusicPlayer } from "./music-player/music-player";
import { MusicPlayerNowPlaying } from "./music-player/music-player-nowplaying";
import { MusicPlayerWebSocket } from "./music-player/music-player-websocket";
import { SearchResultItemViewModel, SearchResultItem } from "./search-result-item";
import * as defaultCSS from "../scss/default.scss";
import { clipboard, ipcRenderer } from "electron";
import { existsSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import Vue from "vue";
import { InputModes } from "./input-modes";

const config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

if (config.blurBackground) {
    ipcRenderer.send(IpcChannels.rendererInit);
}

document.addEventListener("keyup", handleGlobalKeyPress);
document.addEventListener("keydown", handleHoldingKey);

let prefix = "";
let cavetPosition: number | null = null;
const isValidFilePath = new FilePathExecutionArgumentValidator().isValidForExecution;
let inputMode: InputModes = InputModes.RUN;

interface HistoryItem {
    input: string;
    mode: InputModes;
}

const inputHistory = [] as HistoryItem[];
let historyIndex = -1;

const screenshotLink = new URL(join(homedir(), "acrylic.bmp")).href;

let shouldRotateCompletions = false;
let autoCompList: string [] = [];
let autoCompIndex = 0;

const iconManager = new IconManager(config);

const nextHotKey = new Hotkey(config.musicPlayerHotkeyNext);
const backHotKey = new Hotkey(config.musicPlayerHotkeyBack);
const playPauseHotKey = new Hotkey(config.musicPlayerHotkeyPlayPause);
const likeHotKey = new Hotkey(config.musicPlayerHotkeyLike);

const customCSSPath = join(homedir(), "ueli.custom.css");
const vue = new Vue({
    data: {
        autoFocus: true,
        commandLineOutput: [] as string[],
        customStyleSheet: customCSSPath,
        isMouseMoving: false,
        musicPlayer: {
            albumCover: "",
            artist: "",
            liked: false,
            playerConnectStatus: false,
            smallSize: config.musicPlayerSmallSize,
            state: false,
            track: "",
        },
        notifyIcon: "",
        notifying: false,
        scopes: [] as string[],
        screenshotFile: "",
        searchIcon: "",
        searchResults: [] as SearchResultItemViewModel[],
        showAlternativePrefix: false,
        showIndexNum: false,
        stylesheetPath: `./build/${defaultCSS && "default"}.css`,
        userInput: "",
    },
    el: "#vue-root",
    methods: {
        handleClick: (): void => {
            handleEnterPress();
            focusOnInput();
        },
        handleKeyPress: (event: KeyboardEvent): void => {
            vue.isMouseMoving = false;

            if (event.key === "Enter" && event.altKey) {
                handleEnterPress(true);
            } else if (event.key === "Enter") {
                handleEnterPress(false);
            } else if (event.ctrlKey && event.key === "o") {
                handleOpenFileLocation();
            } else if (event.ctrlKey && event.shiftKey && event.key === "C") {
                handleCopyArgument();
            } else if (event.ctrlKey && event.key === "ArrowUp") {
                changeHistoryIndex(1);
            } else if (event.ctrlKey && event.key === "ArrowDown") {
                changeHistoryIndex(-1);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const direction = event.key === "ArrowDown" ? 1 : -1;
                changeActiveItem(direction);
            } else if (event.ctrlKey && event.key === "Tab") {
                rotateMode(event.shiftKey ? -1 : 1);
            } else if (event.key === "Tab") {
                event.preventDefault();
                handleAutoCompletion(event.shiftKey ? -1 : 1);
            } else if (event.key === "Escape") {
                ipcRenderer.send(IpcChannels.hideWindow);
            } else if (event.key === "Backspace") {
                if (vue.userInput.length === 0) {
                    if (prefix) {
                        vue.userInput = prefix.slice(0, prefix.length - 1);
                        prefix = "";
                        onChangeUserInput(vue.userInput);
                    }
                } else {
                    autoDeleteSymbolPairs();
                }
            } else if (event.ctrlKey && !isNaN(event.key as unknown as number)) {
                let index = parseInt(event.key, 10) - 1;
                if (index === -1) {
                    index = 9;
                }

                if (index >= vue.searchResults.length) {
                    handleExecuteFromNum(vue.searchResults.length - 1, event.altKey);
                } else {
                    handleExecuteFromNum(index, event.altKey);
                }
            } else if (event.key !== "Shift"
             && event.key !== "Ctrl"
             && event.key !== "Alt"
             && event.key !== "Meta"
            ) {
                shouldRotateCompletions = false;
                autoCompList.length = 0;
                autoCompIndex = 0;
                autoCompleteSymbolPairs(event.key);
            }
        },
        handleMouseMove: (event: MouseEvent): void => {
            if (event.movementX !== 0 || event.movementY !== 0) {
                vue.isMouseMoving = true;
            }
        },
        handleMouseOver: (index: number): void => {
            if (vue.isMouseMoving) {
                resetActiveState();
                vue.searchResults[index].active = true;
            }
        },
        handleRightClick: (index: number): void => {
            const arg = vue.searchResults[index].executionArgument;
            if (isValidFilePath(arg)) {
                ipcRenderer.send(IpcChannels.activateContextMenu, arg);
            }
        },
        likeTrack,
        nextTrack,
        outputContainerHeight: (): string => {
            return `height: calc(100vh - ${config.userInputHeight}px - 40px);`;
        },
        playPauseTrack,
        previousTrack,
        searchResultAlternativePrefixStyle: (): string => {
            return `font-size: ${config.searchResultNameFontSize - 4}px;`;
        },
        searchResultExecutionArgumentStyle: (): string => {
            return `font-size: ${config.searchResultExecutionArgumentFontSize}px;`;
        },
        searchResultHeight: (): string => {
            return `height: ${config.searchResultHeight}px`;
        },
        searchResultIconStyle: (): string => {
            return `height: ${config.searchResultHeight}px; width: ${config.searchResultHeight}px;`;
        },
        searchResultIndexNumStyle: (): string => {
            return `font-size: ${config.searchResultExecutionArgumentFontSize}px;`;
        },
        searchResultNameStyle: (): string => {
            return `font-size: ${config.searchResultNameFontSize}px;`;
        },
        searchResultWidth: (): string => {
            return `width: ${config.searchResultHeight}px; min-width: ${config.searchResultHeight}px;`;
        },
        userInputContainerStyle: (): string => {
            return `height: ${config.userInputHeight}px;`;
        },
        userInputStyle: (): string => {
            return `font-size: ${config.userInputFontSize}px;`;
        },
    },
    watch: {
        userInput: onChangeUserInput,
    },
});

// Check custom css file availability
if (!existsSync(customCSSPath)) {
    writeFileSync(customCSSPath, `:root {
    --background-color: 0,0,0;
    --input-container-background: rgba(var(--background-color), 0.5);
    --output-container-background: rgba(var(--background-color), 0.4);
    --text-color: rgb(255,255,255);
    --active-item-background: rgb(237,152,47);
    --active-item-text-color: rgb(255,255,255);
    --mono-text-color: rgb(242,242,242);
    --scrollbar-color: rgb(68,68,68);
    --alternative-prefix-background: rgba(var(--background-color), 0.8);
    --noise-amount: 0.3;
    --corner-radius: 10px;
    --font-family: "SF Pro Text", "Segoe UI", "Helvetica";
    --player-font-family: "SF Pro Display", "Segoe UI", "Helvetica";
    --font-family-mono: "Consolas", "Courier", monospace;
    --font-icon: "Segoe MDL2 Assets";
}`, "utf-8");
}

onMainWindowShow();

const playerType = config.musicPlayerType.toLowerCase();

let player: MusicPlayer | undefined;

if (playerType === "local") {
    player = new MusicPlayerNowPlaying(config.musicPlayerLocalName.toLowerCase());
} else if (playerType === "websocket") {
    player = new MusicPlayerWebSocket(config.musicPlayerWebSocketPort);
} else {
    player = undefined;
}

if (player !== undefined) {
    player.artist.onChange = (info) => vue.musicPlayer.artist = info;
    player.cover.onChange = (info) => {
        try {
            const url = new URL(info);
            vue.musicPlayer.albumCover = "url(" + url.href + ")";
        } catch (e) {
            // nah
        }
    };
    player.state.onChange = (info) => vue.musicPlayer.state = info;
    player.rating.onChange = (info) => vue.musicPlayer.liked = info >= 3;
    player.title.onChange = (info) => vue.musicPlayer.track = info;
    player.connectStatus.onChange = (info) => {
        vue.musicPlayer.playerConnectStatus = info;
        ipcRenderer.send(IpcChannels.playerConnectStatus, info);
    };
}

ipcRenderer.send(IpcChannels.setModeIcon);

function onChangeUserInput(val: string): void {
    vue.commandLineOutput = [] as string[];
    if (cavetPosition !== null) {
        const inputElement = document.getElementsByTagName("input")[0];
        inputElement.selectionStart = inputElement.selectionEnd = cavetPosition;
        cavetPosition = null;
    }
    if (prefix) {
        ipcRenderer.send(IpcChannels.getSearch, prefix + val);
    } else {
        ipcRenderer.send(IpcChannels.getSearch, val);
    }
}

function updateSearchResults(searchResults: SearchResultItem[] | null): void {
    if (searchResults === null) {
        vue.searchResults.length = 0;
        return;
    }

    vue.searchResults = searchResults.map((searchResultItem: SearchResultItem, index: number): SearchResultItemViewModel => {
        const viewModel = searchResultItem as SearchResultItemViewModel;
        viewModel.id = index;
        viewModel.active = false;

        if (iconManager[searchResultItem.icon as keyof IconManager]) {
            viewModel.icon = iconManager[searchResultItem.icon as keyof IconManager].call(iconManager);
        }

        if (!viewModel.hideDescription) {
            if (viewModel.breadCrumb) {
                const crumbString = viewModel.breadCrumb.join(config.directorySeparator);

                if (crumbString) {
                    viewModel.description = crumbString;
                }
            } else {
                viewModel.description = searchResultItem.executionArgument;
            }
        }

        return viewModel;
    });

    if (vue.searchResults.length > 0) {
        vue.searchResults[0].active = true;
        scrollIntoView(vue.searchResults[0]);
    }
}

function resetActiveState(): void {
    for (const result of vue.searchResults) {
        if (result.active) {
            result.active = false;
            return;
        }
    }
}

function changeActiveItem(direction: -1 | 1): void {
    if (vue.searchResults.length === 0) {
        return;
    }

    let nextIndex: number | undefined;

    for (let i = 0; i < vue.searchResults.length; i++) {
        if (vue.searchResults[i].active) {
            nextIndex = i + direction;
            break;
        }
    }

    if (nextIndex === undefined) {
        return;
    }

    resetActiveState();

    if (nextIndex < 0) {
        nextIndex = vue.searchResults.length - 1;
    } else if (nextIndex >= vue.searchResults.length) {
        nextIndex = 0;
    }

    vue.searchResults[nextIndex].active = true;
    scrollIntoView(vue.searchResults[nextIndex]);
}

function scrollIntoView(searchResult: SearchResultItemViewModel): void {
    const htmlElement = document.getElementById(`search-result-item-${searchResult.id}`);
    if (htmlElement !== undefined && htmlElement !== null) {
        htmlElement.scrollIntoView();
    }
}

function handleEnterPress(alternative = false): void {
    const activeItem = getActiveItem();

    if (activeItem === undefined) {
        return;
    }

    if (alternative) {
        if (activeItem.alternativeExecutionArgument) {
            execute(activeItem.alternativeExecutionArgument, true);
        } else {
            execute(activeItem.executionArgument, true);
        }
    } else {
        execute(activeItem.executionArgument, false);
    }
}

function handleOpenFileLocation(): void {
    const activeItem = getActiveItem();

    if (activeItem === undefined) {
        return;
    }

    const filePath = activeItem.executionArgument;
    if (isValidFilePath(filePath)) {
        FilePathExecutor.openFileLocation(filePath);
    }
}

function handleAutoCompletion(direction: 1 | -1): void {
    const activeItem = getActiveItem();

    if (shouldRotateCompletions && autoCompList.length > 1) {
        autoCompIndex = autoCompIndex + direction;
        if (autoCompIndex > (autoCompList.length - 1)) {
            autoCompIndex = 0;
        } else if (autoCompIndex < 0) {
            autoCompIndex = autoCompList.length - 1;
        }
        prefix = "";
        vue.userInput = autoCompList[autoCompIndex];

        return;
    }

    const userInput = `${prefix}${vue.userInput}`;

    const inputElement = document.getElementsByTagName("input")[0];
    let currentCavetPosition = userInput.length;
    if (inputElement.selectionStart !== null) {
        currentCavetPosition = inputElement.selectionStart;
    }

    ipcRenderer.send(IpcChannels.autoComplete, userInput, currentCavetPosition, activeItem);

    shouldRotateCompletions = true;
}

function getActiveItem(): SearchResultItemViewModel | undefined {
    const index = vue.searchResults.findIndex((item: SearchResultItemViewModel) => item.active);
    return index !== -1 ? vue.searchResults[index] : undefined;
}

function execute(executionArgument: string, alternative: boolean): void {
    ipcRenderer.send(IpcChannels.execute, executionArgument, alternative);
}

function resetUserInput(): void {
    if (vue.userInput) {
        inputHistory.unshift({
            input: `${prefix}${vue.userInput}`,
            mode: inputMode,
        });
        historyIndex = -1;
    }

    vue.userInput = "";
    prefix = "";
    onChangeUserInput("");
}

function handleGlobalKeyPress(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (!event.altKey) {
        hideAlternativePrefix();
    }

    if (!event.ctrlKey) {
        hideIndexNum();
    }

    if (key === "f6" || (key === "l" && event.ctrlKey)) {
        focusOnInput();
    } else if (backHotKey.validateWithEvent(event)) {
        previousTrack();
    } else if (nextHotKey.validateWithEvent(event)) {
        nextTrack();
    } else if (playPauseHotKey.validateWithEvent(event)) {
        playPauseTrack();
    } else if (likeHotKey.validateWithEvent(event)) {
        likeTrack();
        const coverContainerElement = document.getElementById("cover-container");
        if (coverContainerElement) {
            coverContainerElement.classList.add("hover");
            setTimeout(() => {
                coverContainerElement.classList.remove("hover");
            }, 2000);
        }
    }
}

function focusOnInput(): void {
    const userInput = document.getElementById("user-input");
    if (userInput != null) {
        userInput.focus();
    }
}

function previousTrack() {
    if (player) {
        player.prevTrack();
    }
}
function nextTrack() {
    if (player) {
        player.nextTrack();
    }
}
function playPauseTrack() {
    if (player) {
        player.playPause();
    }
}
function likeTrack() {
    if (player) {
        if (player.rating.value >= 3) {
            player.setRating(0);
        } else {
            player.setRating(5);
        }
    }
}

function rotateMode(direction: -1 | 0 | 1) {
    let newMode = inputMode + direction;
    if (newMode < 0) {
        newMode = InputModes.TOTALMODE - 1;
    } else {
        newMode = newMode % InputModes.TOTALMODE;
    }

    ipcRenderer.send(IpcChannels.changeMode, newMode, `${prefix}${vue.userInput}`);
}

function handleHoldingKey(event: KeyboardEvent) {
    if (event.altKey) {
        showAlternativePrefix();
    }

    if (event.ctrlKey) {
        showIndexNum();
    }
}

function showAlternativePrefix() {
    vue.showAlternativePrefix = true;
}

function hideAlternativePrefix() {
    vue.showAlternativePrefix = false;
}

function getEndSymbol(inputSymbol: string): string {
    const matchedPair = config.autoCompleteSymbolPairs
        .filter((pair) => pair[0] === inputSymbol);

    if (matchedPair.length === 0) {
        return "";
    }

    return matchedPair[0][1];
}

function autoCompleteSymbolPairs(inputSymbol: string) {
    const endSymbol = getEndSymbol(inputSymbol);

    const inputElement = document.getElementsByTagName("input")[0];
    if (inputElement.selectionEnd === null
     || inputElement.selectionStart === null
     || !endSymbol) {
        return;
    }

    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;

    inputElement.value = StringHelpers.insertString(
        inputElement.value,
        end,
        endSymbol,
    );

    inputElement.selectionStart = inputElement.selectionEnd = start;

    cavetPosition = end + 1;
}

function autoDeleteSymbolPairs() {
    const inputElement = document.getElementsByTagName("input")[0];

    if (inputElement.selectionEnd === null
     || inputElement.selectionStart === null) {
        return;
    }

    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;

    if (end - start === 0 && start > 0) {
        const endSymbol = getEndSymbol(vue.userInput[start - 1]);

        if (endSymbol && inputElement.value[start]
         && endSymbol === inputElement.value[start]) {
            inputElement.value = inputElement.value.substring(0, start) + inputElement.value.substring(start + 1);
            inputElement.selectionStart = inputElement.selectionEnd = start;
        }
    }
}

let notifyingTimeout: NodeJS.Timer | number | null = null;

function notify(iconFunctionName: keyof IconManager) {
    if (notifyingTimeout !== null) {
        clearTimeout(notifyingTimeout as number);
    }

    vue.notifying = true;
    vue.notifyIcon = iconManager[iconFunctionName].call(iconManager);
    notifyingTimeout = setTimeout(() => {
        vue.notifying = false;
        notifyingTimeout = null;
    }, 2000);
}

function handleCopyArgument() {
    const activeItem = getActiveItem();
    if (activeItem !== undefined) {
        clipboard.writeText(activeItem.executionArgument);
        notify("getClipboardIcon");
    }
}

function changeHistoryIndex(direction: 1 | -1) {
    const nextIndex = historyIndex + direction;
    if (nextIndex >= 0 && nextIndex < inputHistory.length && inputHistory[nextIndex]) {
        historyIndex = nextIndex;
        prefix = "";
        vue.userInput = inputHistory[historyIndex].input;
        ipcRenderer.send(
            IpcChannels.changeMode,
            inputHistory[historyIndex].mode,
            inputHistory[historyIndex].input,
        );
    }
}

function handleLinkClick(link: string): void {
    execute(link, false);
}

function onMainWindowShow() {
    if (config.blurBackground) {
        vue.screenshotFile =  `${screenshotLink}?${Date.now()}`;
    }
    focusOnInput();
}

function handleExecuteFromNum(index: number, alternative = false) {
    resetActiveState();
    vue.searchResults[index].active = true;
    handleEnterPress(alternative);
}

function showIndexNum() {
    vue.showIndexNum = true;
}

function hideIndexNum() {
    vue.showIndexNum = false;
}

(global as any).handleLinkClick = handleLinkClick;

ipcRenderer.on(IpcChannels.getSearchIconResponse, (_event: Electron.Event, arg: string): void => {
    vue.searchIcon = iconManager[arg as keyof IconManager].call(iconManager);
});

ipcRenderer.on(IpcChannels.commandLineOutput, (_event: Electron.Event, arg: string): void => {
    vue.commandLineOutput.push(arg);
});

ipcRenderer.on(IpcChannels.resetUserInput, resetUserInput);

ipcRenderer.on(IpcChannels.onMove, (_event: Electron.Event, arg: [number, number]): void => {
    const ele = document.querySelectorAll("#acrylic img")[0] as HTMLElement;
    ele.style.left = `${-arg[0] - 20}px`;
    ele.style.top = `${-arg[1] - 20}px`;
});

ipcRenderer.on(IpcChannels.mainShow, onMainWindowShow);

ipcRenderer.on(IpcChannels.websocketPlayURL, (_event: Event, arg: string) => {
    const tempPlayer = player as MusicPlayerWebSocket;
    if (tempPlayer && tempPlayer.playURL) {
        tempPlayer.playURL(arg);
    }
});

ipcRenderer.on(IpcChannels.searchWebsocket, (_event: Electron.Event, query: string): void => {
    const crawler = (player as MusicPlayerWebSocket);
    if (query && crawler.sendCommand) {
        crawler.sendCommand("search " + query);
        let counter = 0;
        const interval = setInterval(() => {
            if (crawler.searchResult !== null && ++counter <= 200) {
                ipcRenderer.send(IpcChannels.getWebsocketSearchResponse, crawler.searchResult);
                crawler.searchResult = null;
                clearInterval(interval);
            }
        }, 50);
    } else {
        ipcRenderer.send(IpcChannels.getWebsocketSearchResponse, []);
    }
});

ipcRenderer.on(IpcChannels.getSearchResponse, (_event: Electron.Event, arg: SearchResultItem[] | null): void => {
    updateSearchResults(arg);
});

ipcRenderer.on(IpcChannels.getScopes, (_event: Event, arg: string[]): void => {
    if (arg.length > 1) {
        prefix = arg[0];
        vue.userInput = arg[1];
        vue.scopes = arg.slice(2);
    } else {
        vue.scopes = [];
    }
});

ipcRenderer.on(IpcChannels.autoCompleteResponse, (_event: Event, arg: string[]): void => {
    prefix = "";
    autoCompList = arg;
    autoCompIndex = 0;
    vue.userInput = arg[0];
});

ipcRenderer.on(IpcChannels.inputMode, (_: Event, mode: InputModes) => {
    inputMode = mode;
});
