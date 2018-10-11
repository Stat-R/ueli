import { CustomCommand } from "./custom-command";
import { WebSearch } from "./web-search";

interface FeatureOptions {
    bookmark: boolean;
    calculator: boolean;
    commandLine: boolean;
    customCommands: boolean;
    environmentVariables: boolean;
    fileBrowser: boolean;
    homeFolder: boolean;
    programs: boolean;
    spotify: boolean;
    systemSettings: boolean;
    ueliCommands: boolean;
    webSearch: boolean;
    webUrl: boolean;
    youtube: boolean;
}

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
    features: FeatureOptions;
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
    searchResultExecutionArgumentFontSize: number;
    searchResultHeight: number;
    searchResultNameFontSize: number;
    useNativeApplicationIcon: boolean;
    userInputHeight: number;
    userInputFontSize: number;
    textEditor: {
        name: string;
        path: string;
    };
    webSearches: WebSearch[];
    windowWidth: number;
}
