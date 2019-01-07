import { ConfigOptions } from "./config-options";
import { ExternalOnlinePlugin, ExternalRunPlugin } from "./external-plugin";
import { WebSocketSearchResult } from "./music-player/websocket";
import { Taskbar } from "taskbar-node";

export interface GlobalUELI {
    config: ConfigOptions;
    runPluginCollection: ExternalRunPlugin[];
    onlinePluginCollection: ExternalOnlinePlugin[];
    taskbar: Taskbar;
    webSocketCommandSender: (command: string) => void;
    webSocketSearch: (input: string) => Promise<WebSocketSearchResult[]>;
}
