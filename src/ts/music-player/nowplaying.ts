import { MusicInfoHandler } from "./info-handler";
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

    constructor(name: string) {
        this.title = new MusicInfoHandler();
        this.artist = new MusicInfoHandler();
        this.cover = new MusicInfoHandler();
        this.state = new MusicInfoHandler();
        this.rating = new MusicInfoHandler();
        this.connectStatus = new MusicInfoHandler();

        let player: PlayerName = PlayerName.AIMP;
        if (name === "aimp") {
            player = PlayerName.AIMP;
        } else if (name === "cad") {
            player = PlayerName.CAD;
        } else if (name === "foobar") {
            player = PlayerName.FOOBAR;
        } else if (name === "itunes") {
            player = PlayerName.ITUNES;
        } else if (name === "mediamonkey") {
            player = PlayerName.MEDIAMONKEY;
        } else if (name === "spotify") {
            player = PlayerName.SPOTIFY;
        } else if (name === "winamp") {
            player = PlayerName.WINAMP;
        } else if (name === "wmp") {
            player = PlayerName.WMP;
        }

        this.nowplaying = new NowPlaying({
            fetchCover: true,
            player,
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
        if (this.nowplaying) {
            this.nowplaying.next();
        }
    }

    public prevTrack() {
        if (this.nowplaying) {
            this.nowplaying.previous();
        }
    }

    public playPause() {
        if (this.nowplaying) {
            if (this.nowplaying.getState()) {
                this.nowplaying.pause();
            } else {
                this.nowplaying.play();
            }
        }
    }

    public setRating(rating: number): void {
        if (this.nowplaying) {
            this.nowplaying.setRating(rating);
        }
    }
}
