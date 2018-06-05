import { IpcChannels } from "./ipc-channels";
import { InfoSender, MusicInfoHandler } from "./music-info-handler";
import { ipcRenderer } from "electron";
import { NowPlaying, PlayerName } from "nowplaying-node";
import * as ws from "ws";

export const NowPlayingPlayerName = PlayerName;

export class MusicPlayerNowPlaying {
    public artist: MusicInfoHandler<string>;
    public cover: MusicInfoHandler<string>;
    public sender: InfoSender;
    public state: MusicInfoHandler<number>;
    public rating: MusicInfoHandler<number>;
    public title: MusicInfoHandler<string>;
    public connectStatus: MusicInfoHandler<boolean>;
    private nowplaying: NowPlaying;

    constructor(playerName: PlayerName, sender: InfoSender) {
        this.title = new MusicInfoHandler(sender, IpcChannels.playerTrack);
        this.artist = new MusicInfoHandler(sender, IpcChannels.playerArtist);
        this.cover = new MusicInfoHandler(sender, IpcChannels.playerAlbumCover);
        this.state = new MusicInfoHandler(sender, IpcChannels.playerState);
        this.rating = new MusicInfoHandler(sender, IpcChannels.playerState);
        this.connectStatus = new MusicInfoHandler(sender, IpcChannels.playerConnectStatus);

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
                this.state.value = this.nowplaying.getState();
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
