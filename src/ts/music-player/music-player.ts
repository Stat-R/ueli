import { MusicInfoHandler } from "./info-handler";

export interface MusicPlayer {
    artist: MusicInfoHandler<string>;
    cover: MusicInfoHandler<string>;
    state: MusicInfoHandler<boolean>;
    rating: MusicInfoHandler<number>;
    title: MusicInfoHandler<string>;
    connectStatus: MusicInfoHandler<boolean>;
    nextTrack: () => void;
    prevTrack: () => void;
    playPause: () => void;
    setRating: (rating: number) => void;
}
