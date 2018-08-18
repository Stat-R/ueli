import { ConfigOptions } from "./config-options";
import { WebSocketSearchResult } from "./music-player/music-player-websocket";

export interface GlobalUELI {
    config: ConfigOptions;
    runPluginCollection: any[];
    onlinePluginCollection: any[];
    webSocketCommandSender: (command: string) => void;
    webSocketSearch: (input: string) => Promise<WebSocketSearchResult[]>;
}