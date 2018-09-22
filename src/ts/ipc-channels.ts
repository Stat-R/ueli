import { UeliHelpers } from "./helpers/ueli-helpers";

export class IpcChannels {
    public static readonly hideWindow = "hide-window";
    public static readonly execute = "execute";
    public static readonly alternativeExecute = "alternative-execute";
    public static readonly getSearch = "get-search";
    public static readonly getSearchResponse = "get-search-response";
    public static readonly openFileLocation = "open-file-location";
    public static readonly setModeIcon = "set-mode-icon";
    public static readonly getSearchIconResponse = "get-search-icon-response";
    public static readonly autoComplete = "auto-complete";
    public static readonly autoCompleteResponse = "auto-complete-response";
    public static readonly commandLineExecution = "command-line-execution";
    public static readonly commandLineOutput = "command-line-output";
    public static readonly ueliReload = `${UeliHelpers.ueliCommandPrefix}reload`;
    public static readonly ueliExit = `${UeliHelpers.ueliCommandPrefix}exit`;
    public static readonly resetCommandlineOutput = "reset-commandline-output";
    public static readonly resetUserInput = "reset-user-input";
    public static readonly playerConnectStatus = "player-connect-status";
    public static readonly playerArtist = "player-artist";
    public static readonly playerAlbum = "player-album";
    public static readonly playerTrack = "player-track";
    public static readonly playerAlbumCover = "player-cover";
    public static readonly playerState = "player-state";
    public static readonly playerPrevTrack = "player-nexttrack";
    public static readonly playerNextTrack = "player-prevtrack";
    public static readonly playerPlayPause = "player-playpause";
    public static readonly playerLikeTrack = "player-liketrack";
    public static readonly getWebsocketSearchResponse = "get-websocket-search-response";
    public static readonly searchWebsocket = "search-websocket";
    public static readonly websocketPlayURL = "web-socket-playurl";

    public static readonly rotateMode = "rotate-mode";
    public static readonly onMove = "on-move";

    public static readonly elevatedExecute = "elevate-execute";

    public static readonly rendererInit = "renderer-init";
    public static readonly mainShow = "main-show";

    public static readonly activateContextMenu = "activate-context-menu";

    public static readonly setLoadingIcon = "set-loading-icon";

    public static readonly getScopes = "get-scopes";
}
