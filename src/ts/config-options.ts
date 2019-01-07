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
    runModeSwitchTo: boolean;
    spotify: boolean;
    systemSettings: boolean;
    ueliCommands: boolean;
    webSearch: boolean;
    webUrl: boolean;
    youtube: boolean;
}

export interface CustomIcons {
    bookmark?: string;
    calculator?: string;
    clipboard?: string;
    commandLine?: string;
    customShortcut?: string;
    everything?: string;
    file?: string;
    folder?: string;
    loading?: string;
    online?: string;
    program?: string;
    search?: string;
    url?: string;
    variable?: string;
    windows?: string;
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
    customIcons: CustomIcons;
    directorySeparator: string;
    everythingFilterFilePath: string;
    features: FeatureOptions;
    hotkeyEverythingMode: string;
    hotkeyEverythingModeCwd: string;
    hotkeyOnlineMode: string;
    hotkeyRunMode: string;
    hotkeyRunModeCwd: string;
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
