import { SpotifyCompleter } from "./completer/spotify-completer";
import { GlobalUELI } from "./global-ueli";
import { InputValidatorSearcherCombination } from "./input-validator-searcher-combination";
import { PrefixInputValidator } from "./input-validators/prefix-input-validator";
import { SpotifyInputValidator } from "./input-validators/spotify-input-validator";
import { SpotifySearcher } from "./searcher-online/spotify-searcher";
import { YoutubeSearcher } from "./searcher-online/youtube-searcher";

export class OnlineInputValidatorSearcherCombinationManager {
    private combinations: InputValidatorSearcherCombination[];

    constructor(globalUELI: GlobalUELI) {
        this.combinations = [];
        if (globalUELI.config.features.spotify) {
            this.combinations.push({
                completer: new SpotifyCompleter,
                searcher: new SpotifySearcher(globalUELI.webSocketSearch),
                validator: new SpotifyInputValidator,
            });
        }

        if (globalUELI.config.features.youtube) {
            this.combinations.push({
                searcher: new YoutubeSearcher,
                validator: new PrefixInputValidator("y!", "Youtube"),
            });
        }

        for (const plugin of globalUELI.onlinePluginCollection) {
            this.combinations.push({
                completer: plugin.completer ? new plugin.completer : undefined,
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
            if (comb.searcher.destruct) {
                comb.searcher.destruct();
            }
            if (comb.validator.destruct) {
                comb.validator.destruct();
            }
            if (comb.completer && comb.completer.destruct) {
                comb.completer.destruct();
            }
        });
    }
}
