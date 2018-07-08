import { ColorThemeLoader } from "./color-theme-loader";
import { ConfigFileRepository } from "./config-file-repository";
import { defaultConfig } from "./default-config";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { IpcChannels } from "./ipc-channels";
import { SearchResultItemViewModel } from "./search-result-item-view-model";
import { ipcRenderer } from "electron";
import { homedir, platform } from "os";
import Vue from "vue";
import { Injector } from "./injector";
import * as os from "os";
import { Hotkey } from "./hotkey";
const colorThemeLoader = new ColorThemeLoader();
const config = new ConfigFileRepository(defaultConfig, UeliHelpers.configFilePath).getConfig();

document.addEventListener("keyup", handleGlobalKeyPress);
document.addEventListener("keydown", handleHoldingKey);

const vue = new Vue({
    data: {
        albumCover: "",
        artist: "",
        autoFocus: true,
        commandLineOutput: [] as string[],
        customStyleSheet: `${homedir()}\\ueli.custom.css`,
        isMouseMoving: false,
        liked: false,
        mode: "",
        playerConnectStatus: false,
        screenshotFile: "",
        searchIcon: "",
        searchResults: [] as SearchResultItemViewModel[],
        showAlternativePrefix: false,
        state: false,
        stylesheetPath: `./build/${config.colorTheme}.css`,
        track: "",
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
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                vue.isMouseMoving = false;
                const direction = event.key === "ArrowDown" ? "next" : "prev";
                changeActiveItem(direction);
            } else if (event.key === "Tab") {
                event.preventDefault();
                handleAutoCompletion();
            } else if (event.key === "Escape") {
                ipcRenderer.send(IpcChannels.hideWindow, true);
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
        likeTrack,
        nextTrack,
        outputContainerHeight: (): string => {
            return `height: calc(100vh - ${config.userInputHeight}px);`;
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
            return `width: ${config.searchResultHeight}px;`;
        },
        userInputContainerStyle: (): string => {
            return `height: ${config.userInputHeight}px;`;
        },
        userInputStyle: (): string => {
            return `font-size: ${config.userInputFontSize}px;`;
        },
    },
    watch: {
        userInput: (val: string): void => {
            vue.commandLineOutput = [] as string[];
            ipcRenderer.send(IpcChannels.getSearch, val);
        },
    },
});

ipcRenderer.on(IpcChannels.getSearchResponse, (event: Electron.Event, arg: SearchResultItemViewModel[]): void => {
    updateSearchResults(arg);
});

ipcRenderer.send(IpcChannels.getSearchIcon);

ipcRenderer.on(IpcChannels.getSearchIconResponse, (event: Electron.Event, arg: string): void => {
    vue.searchIcon = iconManager[arg].call();
});

ipcRenderer.on(IpcChannels.autoCompleteResponse, (event: Electron.Event, arg: string): void => {
    vue.userInput = arg;
});

ipcRenderer.on(IpcChannels.commandLineOutput, (event: Electron.Event, arg: string): void => {
    vue.commandLineOutput.push(arg);
});

ipcRenderer.on(IpcChannels.resetUserInput, resetUserInput);

const iconManager = Injector.getIconManager(os.platform());

function updateSearchResults(searchResults: SearchResultItemViewModel[]): void {
    searchResults.forEach((searchResultItem: SearchResultItemViewModel, index: number): void => {
        searchResultItem.id = `search-result-item-${index}`;
        searchResultItem.active = false;
        if (searchResultItem.breadCrumb) {
            searchResultItem.description = searchResultItem.breadCrumb.join(config.directorySeparator);
        }
        if (iconManager[searchResultItem.icon]) {
            searchResultItem.icon = iconManager[searchResultItem.icon].call();
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

function changeActiveItem(direction: string): void {
    if (vue.searchResults.length === 0) {
        vue.isMouseMoving = false;
        return;
    }

    let nextIndex;

    for (let i = 0; i < vue.searchResults.length; i++) {
        if (vue.searchResults[i].active) {
            nextIndex = direction === "next"
                ? i + 1
                : i - 1;
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
        ipcRenderer.send(IpcChannels.openFileLocation, activeItem.executionArgument);
    }
}

function handleAutoCompletion(): void {
    const activeItem = getActiveItem();

    if (activeItem !== undefined) {
        ipcRenderer.send(IpcChannels.autoComplete, [vue.userInput, activeItem.executionArgument]);
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
    vue.userInput = "";
}

const nextHotKey = new Hotkey(config.musicPlayerHotkeyNext);
const backHotKey = new Hotkey(config.musicPlayerHotkeyBack);
const playPauseHotKey = new Hotkey(config.musicPlayerHotkeyPlayPause);
const likeHotKey = new Hotkey(config.musicPlayerHotkeyLike);

function handleGlobalKeyPress(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (event.keyCode === 18) {
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
        const cover = document.getElementById("cover-container");
        if (cover) {
            cover.classList.add("hover");
            setTimeout(() => {
                cover.classList.remove("hover");
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

ipcRenderer.on(IpcChannels.playerTrack, (event: Electron.Event, arg: string): void => {
    vue.track = arg;
});

ipcRenderer.on(IpcChannels.playerArtist, (event: Electron.Event, arg: string): void => {
    vue.artist = arg;
});

ipcRenderer.on(IpcChannels.playerAlbumCover, (event: Electron.Event, arg: string): void => {
    try {
        const url = new URL(arg);
        vue.albumCover = "url(" + url.href + ")";
    } catch (e) {
        // nah
    }
});

ipcRenderer.on(IpcChannels.playerState, (event: Electron.Event, arg: boolean): void => {
    vue.state = arg;
});

ipcRenderer.on(IpcChannels.playerLikeTrack, (event: Electron.Event, arg: number): void => {
    vue.liked = arg > 3;
});

ipcRenderer.on(IpcChannels.playerConnectStatus, (event: Electron.Event, arg: boolean): void => {
    vue.playerConnectStatus = arg;
    ipcRenderer.send(IpcChannels.playerConnectStatus, arg);
});

function previousTrack() {
    ipcRenderer.send(IpcChannels.playerPrevTrack);
}
function nextTrack() {
    ipcRenderer.send(IpcChannels.playerNextTrack);
}
function playPauseTrack() {
    ipcRenderer.send(IpcChannels.playerPlayPause);
}
function likeTrack() {
    ipcRenderer.send(IpcChannels.playerLikeTrack);
}

ipcRenderer.on(IpcChannels.tookScreenshot, (event: Electron.Event, arg: string): void => {
    vue.screenshotFile = new URL(`${arg}?${Date.now()}`).href;
});

function rotateMode(direction: -1 | 0 | 1) {
    ipcRenderer.send(IpcChannels.rotateMode, direction);
}

ipcRenderer.on(IpcChannels.moveX, (event: Electron.Event, arg: number): void => {
    const ele = document.querySelectorAll("#acrylic img")[0] as HTMLElement;
    ele.style.left = `${-arg}px`;
});

ipcRenderer.on(IpcChannels.moveY, (event: Electron.Event, arg: number): void => {
    const ele = document.querySelectorAll("#acrylic img")[0] as HTMLElement;
    ele.style.top = `${-arg}px`;
});

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
