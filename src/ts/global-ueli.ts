import { ConfigOptions } from "./config-options";
import { ExternalOnlinePlugin, ExternalRunPlugin } from "./external-plugin";
import { WebSocketSearchResult } from "./music-player/music-player-websocket";

export interface GlobalUELI {
    config: ConfigOptions;
    runPluginCollection: ExternalRunPlugin[];
    onlinePluginCollection: ExternalOnlinePlugin[];
    webSocketCommandSender: (command: string) => void;
    webSocketSearch: (input: string) => Promise<WebSocketSearchResult[]>;
}
