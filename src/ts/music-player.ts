import * as ws from "ws";
import { ipcRenderer } from "electron";
import { IpcChannels } from "./ipc-channels";
import { MusicInfoHandler, InfoSender } from "./music-info-handler";

export class MusicPlayer {
    public artist: MusicInfoHandler;
    public cover: MusicInfoHandler;
    public sender: InfoSender;
    public state: MusicInfoHandler;
    public title: MusicInfoHandler;
    public connectStatus: MusicInfoHandler;
    private socket: ws;
    private server: ws.Server;
    private port: number;
    // public album: MusicInfoHandler;
    // public position: MusicInfoHandler;
    // public duration: MusicInfoHandler;
    // public volume: MusicInfoHandler;
    // public rating: MusicInfoHandler;
    // public repeat: MusicInfoHandler;
    // public shuffle: MusicInfoHandler;

    constructor(port: number, sender: InfoSender) {
        this.title = new MusicInfoHandler(sender, IpcChannels.playerTrack);
        this.artist = new MusicInfoHandler(sender, IpcChannels.playerArtist);
        this.cover = new MusicInfoHandler(sender, IpcChannels.playerAlbumCover);
        this.state = new MusicInfoHandler(sender, IpcChannels.playerState);
        this.connectStatus = new MusicInfoHandler(sender, IpcChannels.playerConnectStatus);
        // this.album = new MusicInfoHandler(sender, IpcChannels.spotifyAlbum);
        // this.position = new MusicInfoHandler(sender);
        // this.duration = new MusicInfoHandler(sender);
        // this.volume = new MusicInfoHandler(sender);
        // this.rating = new MusicInfoHandler(sender);
        // this.repeat = new MusicInfoHandler(sender);
        // this.shuffle = new MusicInfoHandler(sender);
        this.port = port;
        this.attemptConnect();
    }

    public sendCommand(command: string) {
        this.socket.send(command);
    }

    private attemptConnect() {
        this.server = new ws.Server({ port: this.port });

        this.server.on("connection", (websocket) => {

            this.connectStatus.value = true;

            this.socket = websocket;

            websocket.on("message", (message: string) => {
                this.formatMessage(message);
            });

            websocket.onclose = (event: any) => {
                this.connectStatus.value = false;
            };
        });
    }

    private formatMessage(m: string) {
        const n = m.indexOf(":");
        const type = m.substring(0, n);
        const info = m.substring(n + 1);
        switch (type) {
            case "TITLE":       this.title.value     = info; break;
            case "ARTIST":      this.artist.value    = info; break;
            case "COVER":       this.cover.value     = info; break;
            case "STATE":       this.state.value     = info; break;
            // case "ALBUM":       this.album.value     = info; break;
            // case "POSITION":    this.position.value  = info; break;
            // case "DURATION":    this.duration.value  = info; break;
            // case "VOLUME":      this.volume.value    = info; break;
            // case "RATING":      this.rating.value    = info; break;
            // case "REPEAT":      this.repeat.value    = info; break;
            // case "SHUFFLE":     this.shuffle.value   = info; break;
        }
    }
}
