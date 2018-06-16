import { ConfigOptions } from "./config-options";
import { OnlineInputValidatorSearcherCombination } from "./online-input-validator-searcher-combination";
import { SpotifySearcher } from "./searcher-online/spotify-searcher";
import { WebSocketSearcher } from "./music-player-websocket";
import { SpotifyInputValidator } from "./input-validators/spotify-input-validator";
import { YoutubeSearcher } from "./searcher-online/youtube-searcher";
import { YoutubeInputValidator } from "./input-validators/youtube-input-validator";

export class OnlineInputValidatorSearcherCombinationManager {
    private combinations: OnlineInputValidatorSearcherCombination[];

    constructor(webSocketSearch: WebSocketSearcher) {
        this.combinations = [
            {
                searcher: new SpotifySearcher(webSocketSearch),
                validator: new SpotifyInputValidator(),
            },
            {
                searcher: new YoutubeSearcher(),
                validator: new YoutubeInputValidator(),
            },
        ];
    }

    public getCombinations(): OnlineInputValidatorSearcherCombination[] {
        return this.combinations;
    }
}
