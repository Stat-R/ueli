import { ArgumentCompleter } from "../argument-completer";
import { SearchResultItem } from "../search-result-item";
import { SpotifySearcher } from "../searcher-online/spotify-searcher";

export class SpotifyCompleter implements ArgumentCompleter {
    private prefixList = [`${SpotifySearcher.prefix}playlist!`, `${SpotifySearcher.prefix}album!`, `${SpotifySearcher.prefix}artist!`, `${SpotifySearcher.prefix}playlist!`, `${SpotifySearcher.prefix}show!`, `${SpotifySearcher.prefix}podcast!`]

    public isCompletable(userInput: string, _cavetPosition: number, _selectingResult: SearchResultItem): boolean {
        for (const prefix of this.prefixList) {
            if (prefix.startsWith(userInput)) {
                return true;
            }
        }

        return false;
    }

    public complete(userInput: string,  _cavetPosition: number, _selectingResult: SearchResultItem): string {
        for (const prefix of this.prefixList) {
            if (prefix.startsWith(userInput)) {
                return prefix;
            }
        }

        return "";
    }
}