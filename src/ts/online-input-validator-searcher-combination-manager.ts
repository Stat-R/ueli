import { PrefixInputValidator } from "./input-validators/prefix-input-validator";
import { GlobalUELI } from "./main";
import { OnlineInputValidatorSearcherCombination } from "./online-input-validator-searcher-combination";
import { SpotifySearcher } from "./searcher-online/spotify-searcher";
import { YoutubeSearcher } from "./searcher-online/youtube-searcher";

export class OnlineInputValidatorSearcherCombinationManager {
    private combinations: OnlineInputValidatorSearcherCombination[];

    constructor(globalUELI: GlobalUELI) {
        this.combinations = [
            {
                searcher: new SpotifySearcher(globalUELI.webSocketSearch),
                validator: new PrefixInputValidator("s!", "Spotify"),
            },
            {
                searcher: new YoutubeSearcher(),
                validator: new PrefixInputValidator("y!", "Youtube"),
            },
        ];
    }

    public getCombinations(): OnlineInputValidatorSearcherCombination[] {
        return this.combinations;
    }
}
