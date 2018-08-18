import { GlobalUELI } from "./global-ueli";
import { PrefixInputValidator } from "./input-validators/prefix-input-validator";
import { SpotifyInputValidator } from "./input-validators/spotify-input-validator";
import { OnlineInputValidatorSearcherCombination } from "./online-input-validator-searcher-combination";
import { SpotifySearcher } from "./searcher-online/spotify-searcher";
import { YoutubeSearcher } from "./searcher-online/youtube-searcher";

export class OnlineInputValidatorSearcherCombinationManager {
    private combinations: OnlineInputValidatorSearcherCombination[];

    constructor(globalUELI: GlobalUELI) {
        this.combinations = [
            {
                searcher: new SpotifySearcher(globalUELI.webSocketSearch),
                validator: new SpotifyInputValidator(),
            },
            {
                searcher: new YoutubeSearcher(),
                validator: new PrefixInputValidator("y!", "Youtube"),
            },
        ];

        for (const plugin of globalUELI.onlinePluginCollection) {
            this.combinations.push({
                searcher: new plugin.onlineSearcher(),
                validator: new plugin.inputValidator(),
            });
        }
    }

    public getCombinations(): OnlineInputValidatorSearcherCombination[] {
        return this.combinations;
    }
}
