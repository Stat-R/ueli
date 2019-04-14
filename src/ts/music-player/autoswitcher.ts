import { MusicInfoHandler } from "./info-handler";
import { MusicPlayer } from "./music-player";

export class MusicPlayerAutoSwitcher implements MusicPlayer {
    public artist: MusicInfoHandler<string>;
    public connectStatus: MusicInfoHandler<boolean>;
    public cover: MusicInfoHandler<string>;
    public state: MusicInfoHandler<boolean>;
    public rating: MusicInfoHandler<number>;
    public title: MusicInfoHandler<string>;
    private playerList: MusicPlayer[];
    private player: MusicPlayer;

    constructor(...players: MusicPlayer[]) {
        this.title = new MusicInfoHandler();
        this.artist = new MusicInfoHandler();
        this.cover = new MusicInfoHandler();
        this.state = new MusicInfoHandler();
        this.rating = new MusicInfoHandler();
        this.connectStatus = new MusicInfoHandler();

        this.playerList = players;

        setInterval(() => {
            for (const player of this.playerList) {
                if (player.connectStatus && player.state.value) {
                    if (this.player === player) {
                        return;
                    }

                    this.player = player;

                    this.artist.value = player.artist.value;
                    this.cover.value = player.cover.value;
                    this.state.value = player.state.value;
                    this.rating.value = player.rating.value;
                    this.title.value = player.title.value;
                    this.connectStatus.value = player.connectStatus.value;

                    player.artist.onChange = (info) => this.artist.value = info;
                    player.cover.onChange = (info) => this.cover.value = info;
                    player.state.onChange = (info) => this.state.value = info;
                    player.rating.onChange = (info) => this.rating.value = info;
                    player.title.onChange = (info) => this.title.value = info;
                    player.connectStatus.onChange = (info) => this.connectStatus.value = info;
                }
            }
        }, 1000)
    }

    public nextTrack() {
        if (this.player) {
            this.player.nextTrack();
        }
    }

    public prevTrack() {
        if (this.player) {
            this.player.prevTrack();
        }
    }

    public playPause() {
        if (this.player) {
            this.player.playPause();
        }
    }

    public setRating(rating: number): void {
        if (this.player) {
            this.player.setRating(rating);
        }
    }
}
