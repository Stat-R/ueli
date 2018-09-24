import { ConfigFileRepository } from "./config-file-repository";
import { defaultConfig } from "./default-config";
import { FilePathExecutionArgumentValidator } from "./execution-argument-validators/file-path-execution-argument-validator";
import { FilePathExecutor } from "./executors/file-path-executor";
import { Hotkey } from "./helpers/hotkey";
import { StringHelpers } from "./helpers/string-helpers";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { MacOsIconManager } from "./icon-manager/mac-os-icon-manager";
import { WindowsIconManager } from "./icon-manager/windows-icon-manager";
import { Injector } from "./injector";
import { IpcChannels } from "./ipc-channels";
import { MusicPlayer } from "./music-player/music-player";
import { MusicPlayerNowPlaying } from "./music-player/music-player-nowplaying";
import { MusicPlayerWebSocket } from "./music-player/music-player-websocket";
import { SearchResultItemViewModel } from "./search-result-item";
import * as defaultCSS from "../scss/default.scss";
import { clipboard, ipcRenderer } from "electron";
import { existsSync, writeFileSync } from "fs";
import { homedir, platform } from "os";
import { join } from "path";
import Vue from "vue";

ipcRenderer.send(IpcChannels.rendererInit);

const config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

document.addEventListener("keyup", handleGlobalKeyPress);
document.addEventListener("keydown", handleHoldingKey);
let prefix = "";
let cavetPosition: number | null = null;
const isValidFilePath = new FilePathExecutionArgumentValidator().isValidForExecution;
const inputHistory = [] as string[];
let historyIndex = -1;

const customCSSPath = `${homedir()}/ueli.custom.css`;
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
                vue.isMouseMoving = false;
                const direction = event.key === "ArrowDown" ? 1 : -1;
                changeActiveItem(direction);
            } else if (event.key === "Tab") {
                event.preventDefault();
                handleAutoCompletion();
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
            } else {
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
                vue.isMouseMoving = false;
                vue.searchResults.forEach((searchResultItem: SearchResultItemViewModel) => {
                    searchResultItem.active = false;
                });
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

const playerType = config.musicPlayerType.toLowerCase();

let musicInfoCrawler: MusicPlayer | undefined;

if (playerType === "local") {
    musicInfoCrawler = new MusicPlayerNowPlaying(config.musicPlayerLocalName.toLowerCase());
} else if (playerType === "websocket") {
    musicInfoCrawler = new MusicPlayerWebSocket(config.musicPlayerWebSocketPort);
} else {
    musicInfoCrawler = undefined;
}

if (musicInfoCrawler !== undefined) {
    musicInfoCrawler.artist.onChange = (info) => vue.musicPlayer.artist = info;
    musicInfoCrawler.cover.onChange = (info) => {
        try {
            const url = new URL(info);
            vue.musicPlayer.albumCover = "url(" + url.href + ")";
        } catch (e) {
            // nah
        }
    };
    musicInfoCrawler.state.onChange = (info) => vue.musicPlayer.state = info;
    musicInfoCrawler.rating.onChange = (info) => vue.musicPlayer.liked = info >= 3;
    musicInfoCrawler.title.onChange = (info) => vue.musicPlayer.track = info;
    musicInfoCrawler.connectStatus.onChange = (info) => {
        vue.musicPlayer.playerConnectStatus = info;
        ipcRenderer.send(IpcChannels.playerConnectStatus, info);
    };
}

ipcRenderer.send(IpcChannels.setModeIcon);

const iconManager = Injector.getIconManager(platform());
const coverContainerElement = document.getElementById("cover-container");

const nextHotKey = new Hotkey(config.musicPlayerHotkeyNext);
const backHotKey = new Hotkey(config.musicPlayerHotkeyBack);
const playPauseHotKey = new Hotkey(config.musicPlayerHotkeyPlayPause);
const likeHotKey = new Hotkey(config.musicPlayerHotkeyLike);

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

function updateSearchResults(searchResults: SearchResultItemViewModel[]): void {
    searchResults.forEach((searchResultItem: SearchResultItemViewModel, index: number): void => {
        searchResultItem.id = `search-result-item-${index}`;
        searchResultItem.active = false;

        if (iconManager[searchResultItem.icon as keyof WindowsIconManager & keyof MacOsIconManager]) {
            searchResultItem.icon = iconManager[searchResultItem.icon as keyof WindowsIconManager & keyof MacOsIconManager].call(iconManager);
        }

        if (!searchResultItem.hideDescription) {
            if (searchResultItem.breadCrumb) {
                const descFromBreadCrumb = searchResultItem.breadCrumb.join(config.directorySeparator);
                if (descFromBreadCrumb) {
                    searchResultItem.description = descFromBreadCrumb;
                    return;
                }
            }

            searchResultItem.description = searchResultItem.executionArgument;
        }
    });

    if (searchResults.length > 0) {
        searchResults[0].active = true;
    }

    vue.searchResults = searchResults;

    if (vue.searchResults.length > 0) {
        scrollIntoView(vue.searchResults[0]);
    }
}

function changeActiveItem(direction: -1 | 1): void {
    if (vue.searchResults.length === 0) {
        vue.isMouseMoving = false;
        return;
    }

    let nextIndex;

    for (let i = 0; i < vue.searchResults.length; i++) {
        if (vue.searchResults[i].active) {
            nextIndex = i + direction;
            break;
        }
    }

    vue.searchResults.forEach((searchResultItem: SearchResultItemViewModel) => {
        searchResultItem.active = false;
    });

    if (nextIndex === undefined) {
        return;
    }

    if (nextIndex < 0) {
        nextIndex = vue.searchResults.length - 1;
    } else if (nextIndex >= vue.searchResults.length) {
        nextIndex = 0;
    }

    vue.searchResults[nextIndex].active = true;
    scrollIntoView(vue.searchResults[nextIndex]);
}

function scrollIntoView(searchResult: SearchResultItemViewModel): void {
    const htmlElement = document.getElementById(searchResult.id);
    if (htmlElement !== undefined && htmlElement !== null) {
        htmlElement.scrollIntoView();
    }
}

function handleEnterPress(alternative = false): void {
    const activeItem = getActiveItem();

    if (activeItem !== undefined) {
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
}

function handleOpenFileLocation(): void {
    const activeItem = getActiveItem();

    if (activeItem !== undefined) {
        const filePath = activeItem.executionArgument;
        if (isValidFilePath(filePath)) {
            FilePathExecutor.openFileLocation(filePath);
        }
    }
}

function handleAutoCompletion(): void {
    const activeItem = getActiveItem();

    if (activeItem !== undefined) {
        const userInput = `${prefix}${vue.userInput}`;

        const inputElement = document.getElementsByTagName("input")[0];
        let currentCavetPosition = userInput.length;
        if (inputElement.selectionStart !== null) {
            currentCavetPosition = inputElement.selectionStart;
        }
        ipcRenderer.send(IpcChannels.autoComplete, userInput, currentCavetPosition, activeItem);
    }
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
        inputHistory.unshift(`${prefix}${vue.userInput}`);
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
        if (coverContainerElement) {
            coverContainerElement.classList.add("hover");
            setTimeout(() => {
                coverContainerElement.classList.remove("hover");
            }, 2000);
        }
    } else if (key === "tab" && event.ctrlKey && event.shiftKey) {
        rotateMode(-1);
    } else if (key === "tab" && event.ctrlKey) {
        rotateMode(1);
    }
}

function focusOnInput(): void {
    const userInput = document.getElementById("user-input");
    if (userInput != null) {
        userInput.focus();
    }
}

function previousTrack() {
    if (musicInfoCrawler) {
        musicInfoCrawler.prevTrack();
    }
}
function nextTrack() {
    if (musicInfoCrawler) {
        musicInfoCrawler.nextTrack();
    }
}
function playPauseTrack() {
    if (musicInfoCrawler) {
        musicInfoCrawler.playPause();
    }
}
function likeTrack() {
    if (musicInfoCrawler) {
        if (musicInfoCrawler.rating.value >= 3) {
            musicInfoCrawler.setRating(0);
        } else {
            musicInfoCrawler.setRating(5);
        }
    }
}

function rotateMode(direction: -1 | 0 | 1) {
    ipcRenderer.send(IpcChannels.rotateMode, direction);
}

function handleHoldingKey(event: KeyboardEvent) {
    if (event.altKey) {
        showAlternativePrefix();
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

function notify(iconFunctionName: keyof WindowsIconManager) {
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
        vue.userInput = inputHistory[historyIndex];
    }
}

function handleLinkClick(link: string): void {
    execute(link, false);
}

(global as any).handleLinkClick = handleLinkClick;

ipcRenderer.on(IpcChannels.getSearchIconResponse, (_event: Electron.Event, arg: string): void => {
    vue.searchIcon = iconManager[arg as keyof WindowsIconManager & keyof MacOsIconManager].call(iconManager);
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

const screenshotLink = new URL(join(homedir(), "acrylic.bmp")).href;

ipcRenderer.on(IpcChannels.mainShow, () => {
    if (config.blurBackground) {
        vue.screenshotFile =  `${screenshotLink}?${Date.now()}`;
    }
    focusOnInput();
});

ipcRenderer.on(IpcChannels.websocketPlayURL, (_event: Event, arg: string) => {
    const player = musicInfoCrawler as MusicPlayerWebSocket;
    if (player && player.playURL) {
        player.playURL(arg);
    }
});

ipcRenderer.on(IpcChannels.searchWebsocket, (_event: Electron.Event, query: string): void => {
    const crawler = (musicInfoCrawler as MusicPlayerWebSocket);
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

ipcRenderer.on(IpcChannels.getSearchResponse, (_event: Electron.Event, arg: SearchResultItemViewModel[]): void => {
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

ipcRenderer.on(IpcChannels.autoCompleteResponse, (_event: Event, arg: string): void => {
    prefix = "";
    vue.userInput = arg;
});
