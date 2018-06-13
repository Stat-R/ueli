import { WebSearch } from "./web-search";
import { CustomCommand } from "./custom-command";

export interface ConfigOptions {
    applicationFileExtensions: string[];
    applicationFolders: Array<[string, string]>;
    autoStartApp: boolean;
    colorTheme: string;
    customCommands: CustomCommand[];
    directorySeparator: string;
    imageMagickPath: string;
    maxSearchResultCount: number;
    musicPlayerHeight: number;
    musicPlayerType: string;
    musicPlayerWebSocketPort: number;
    musicPlayerLocalName: string;
    rescanInterval: number;
    searchEngineThreshold: number;
    searchOperatingSystemSettings: boolean;
    searchResultExecutionArgumentFontSize: number;
    searchResultHeight: number;
    searchResultNameFontSize: number;
    userInputHeight: number;
    userInputFontSize: number;
    webSearches: WebSearch[];
    windowWith: number;
}
