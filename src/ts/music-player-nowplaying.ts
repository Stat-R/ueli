import * as ws from "ws";
import { ipcRenderer } from "electron";
import { IpcChannels } from "./ipc-channels";
import { MusicInfoHandler, InfoSender } from "./music-info-handler";

import { NowPlaying, PlayerName } from "nowplaying-node";

export const NowPlayingPlayerName = PlayerName;

export class MusicPlayerNowPlaying {
    public artist: MusicInfoHandler;
    public cover: MusicInfoHandler;
    public sender: InfoSender;
    public state: MusicInfoHandler;
    public title: MusicInfoHandler;
    public connectStatus: MusicInfoHandler;
    private nowplaying: NowPlaying;

    constructor(playerName: PlayerName, sender: InfoSender) {
        this.title = new MusicInfoHandler(sender, IpcChannels.playerTrack);
        this.artist = new MusicInfoHandler(sender, IpcChannels.playerArtist);
        this.cover = new MusicInfoHandler(sender, IpcChannels.playerAlbumCover);
        this.state = new MusicInfoHandler(sender, IpcChannels.playerState);
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
                this.cover.value = this.nowplaying.getCoverPath();
                this.state.value = this.nowplaying.getState();
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
}
