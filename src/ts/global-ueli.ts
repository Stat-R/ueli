import { ConfigOptions } from "./config-options";
import { ExternalOnlinePlugin, ExternalRunPlugin } from "./external-plugin";
import { WebSocketSearchResult } from "./music-player/websocket";
import { Taskbar } from "taskbar-node";
import { NativeUtil } from "./native-lib";

export interface GlobalUELI {
    config: ConfigOptions;
    nativeUtil: NativeUtil;
    onlinePluginCollection: ExternalOnlinePlugin[];
    runPluginCollection: ExternalRunPlugin[];
    taskbar: Taskbar;
    webSocketCommandSender: (command: string) => void;
    webSocketSearch: (input: string) => Promise<WebSocketSearchResult[]>;
}
