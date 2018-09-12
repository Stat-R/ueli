import { GlobalUELI } from "./global-ueli";
import { InputValidatorSearcherCombination } from "./input-validator-searcher-combination";
import { PrefixInputValidator } from "./input-validators/prefix-input-validator";
import { SpotifyInputValidator } from "./input-validators/spotify-input-validator";
import { SpotifySearcher } from "./searcher-online/spotify-searcher";
import { YoutubeSearcher } from "./searcher-online/youtube-searcher";

export class OnlineInputValidatorSearcherCombinationManager {
    private combinations: InputValidatorSearcherCombination[];

    constructor(globalUELI: GlobalUELI) {
        this.combinations = [
            {
                searcher: new SpotifySearcher(globalUELI.webSocketSearch),
                validator: new SpotifyInputValidator,
            },
            {
                searcher: new YoutubeSearcher,
                validator: new PrefixInputValidator("y!", "Youtube"),
            },
        ];

        for (const plugin of globalUELI.onlinePluginCollection) {
            this.combinations.push({
                searcher: new plugin.onlineSearcher,
                validator: new plugin.inputValidator,
            });
        }
    }

    public getCombinations(): InputValidatorSearcherCombination[] {
        return this.combinations;
    }

    public destruct() {
        this.combinations.forEach((comb) => {
            comb.searcher.destruct && comb.searcher.destruct();
            comb.validator.destruct && comb.validator.destruct();
            comb.completer && comb.completer.destruct && comb.completer.destruct();
        })
    }
}
