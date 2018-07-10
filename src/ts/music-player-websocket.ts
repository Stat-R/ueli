import { MusicInfoHandler } from "./music-info-handler";
import * as ws from "ws";
import { MusicPlayer } from "./music-player";

export interface WebSocketSearchResult {
    name: string;
    artist: string;
    url: string;
    image: string;
}

export type WebSocketSearcher = (query: string) => Promise<WebSocketSearchResult[]>;

export class MusicPlayerWebSocket implements MusicPlayer {
    public artist: MusicInfoHandler<string>;
    public cover: MusicInfoHandler<string>;
    public state: MusicInfoHandler<boolean>;
    public rating: MusicInfoHandler<number>;
    public title: MusicInfoHandler<string>;
    public connectStatus: MusicInfoHandler<boolean>;
    public searchResult: WebSocketSearchResult[] | null;
    private socket: ws;
    private server: ws.Server;
    private port: number;

    constructor(port: number) {
        this.title = new MusicInfoHandler();
        this.artist = new MusicInfoHandler();
        this.cover = new MusicInfoHandler();
        this.state = new MusicInfoHandler();
        this.rating = new MusicInfoHandler();
        this.connectStatus = new MusicInfoHandler();
        this.searchResult = null;
        this.port = port;
        this.attemptConnect();
    }

    public nextTrack() {
        this.socket.send("next");
    }

    public prevTrack() {
        this.socket.send("previous");
    }

    public playPause() {
        this.socket.send("playpause");
    }

    public setRating(rating: number): void {
        this.socket.send(`setrating ${rating}`);
    }

    public sendCommand(command: string) {
        this.socket.send(command);
    }

    public playURL(url: string): void {
        this.sendCommand(`playurl ${url}`);
    }

    private attemptConnect() {
        this.server = new ws.Server({ port: this.port });

        this.server.on("connection", (websocket) => {

            this.connectStatus.value = true;

            this.socket = websocket;

            websocket.on("message", (message: string) => {
                this.formatMessage(message);
            });

            websocket.onclose = () => {
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
            case "STATE":       this.state.value     = parseInt(info, 10) === 1; break;
            case "RATING":      this.rating.value     = parseInt(info, 10); break;
            case "SEARCHRESULT": {
                this.searchResult = JSON.parse(info).map(
                    (item: {a: string, i: string, n: string, u: string}) => ({
                        artist: item.a,
                        image: item.i,
                        name: item.n,
                        url: item.u,
                    })) as WebSocketSearchResult[];
                break;
            }
        }
    }
}
