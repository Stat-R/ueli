import { WebSearch } from "./web-search";
import { CustomCommand } from "./custom-command";

export interface ConfigOptions {
    applicationFileExtensions: string[];
    applicationFolders: Array<[string, string]>;
    autoStartApp: boolean;
    bookmarkFromBrowser: string;
    bookmarkProfileName: string;
    customCommands: CustomCommand[];
    directorySeparator: string;
    everythingMaxResults: number;
    everythingFilterFilePath: string;
    hotkeyEverythingMode: string;
    hotkeyOnlineMode: string;
    hotkeyRunMode: string;
    hotkeyWindowsMode: string;
    imageMagickPath: string;
    maxSearchResultCount: number;
    musicPlayerHeight: number;
    musicPlayerType: string;
    musicPlayerWebSocketPort: number;
    musicPlayerLocalName: string;
    musicPlayerHotkeyPlayPause: string;
    musicPlayerHotkeyNext: string;
    musicPlayerHotkeyBack: string;
    musicPlayerHotkeyLike: string;
    musicPlayerHotkeyMute: string;
    searchEngineThreshold: number;
    searchOperatingSystemSettings: boolean;
    searchResultExecutionArgumentFontSize: number;
    searchResultHeight: number;
    searchResultNameFontSize: number;
    userInputHeight: number;
    userInputFontSize: number;
    textEditor: {
        name: string;
        path: string;
    };
    webSearches: WebSearch[];
    windowWidth: number;
}
