import { MusicInfoHandler } from "./music-info-handler";
import { NowPlaying, PlayerName } from "nowplaying-node";
import { MusicPlayer } from "./music-player";

export class MusicPlayerNowPlaying implements MusicPlayer {
    public artist: MusicInfoHandler<string>;
    public connectStatus: MusicInfoHandler<boolean>;
    public cover: MusicInfoHandler<string>;
    public state: MusicInfoHandler<boolean>;
    public rating: MusicInfoHandler<number>;
    public title: MusicInfoHandler<string>;
    private nowplaying: NowPlaying;

    constructor(playerName: PlayerName) {
        this.title = new MusicInfoHandler();
        this.artist = new MusicInfoHandler();
        this.cover = new MusicInfoHandler();
        this.state = new MusicInfoHandler();
        this.rating = new MusicInfoHandler();
        this.connectStatus = new MusicInfoHandler();

        this.nowplaying = new NowPlaying({
            fetchCover: true,
            player: playerName,
        }) as NowPlaying;

        if (this.nowplaying !== undefined) {
            setInterval(() => {
                this.nowplaying.update();
                this.connectStatus.value = this.nowplaying.getStatus();
                this.title.value = this.nowplaying.getTitle();
                this.artist.value = this.nowplaying.getArtist();
                // Nowplaying uses same file to store cover image.
                // Append a meaningless parameter to force browser reload image again.
                this.cover.value = this.nowplaying.getCoverPath() + "?" + this.artist.value + this.title.value;
                this.state.value = this.nowplaying.getState() === 1;
                this.rating.value = this.nowplaying.getRating();
            }, 1000);
        }
    }

    public nextTrack() {
        this.nowplaying.next();
    }

    public prevTrack() {
        this.nowplaying.previous();
    }

    public playPause() {
        if (this.nowplaying.getState()) {
            this.nowplaying.pause();
        } else {
            this.nowplaying.play();
        }
    }

    public setRating(rating: number): void {
        this.nowplaying.setRating(rating);
    }
}
