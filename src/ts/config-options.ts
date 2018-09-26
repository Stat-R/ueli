import { CustomCommand } from "./custom-command";
import { WebSearch } from "./web-search";

export interface ConfigOptions {
    applicationFileExtensions: string[];
    applicationFolders: Array<[string, string]>;
    applicationKeywordBlacklist: string[];
    autoCompleteSymbolPairs: Array<[string, string]>;
    autoStartApp: boolean;
    blurBackground: boolean;
    bookmarkFromBrowser: string;
    bookmarkProfileName: string;
    customCommands: CustomCommand[];
    directorySeparator: string;
    everythingFilterFilePath: string;
    hotkeyEverythingMode: string;
    hotkeyOnlineMode: string;
    hotkeyRunMode: string;
    hotkeyWindowsMode: string;
    maxSearchResultCount: number;
    maxTotalSearchResult: number;
    musicPlayerSmallSize: boolean;
    musicPlayerType: string;
    musicPlayerWebSocketPort: number;
    musicPlayerLocalName: string;
    musicPlayerHotkeyPlayPause: string;
    musicPlayerHotkeyNext: string;
    musicPlayerHotkeyBack: string;
    musicPlayerHotkeyLike: string;
    musicPlayerHotkeyMute: string;
    onlineModeDelay: number;
    powerShellPath: string;
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
