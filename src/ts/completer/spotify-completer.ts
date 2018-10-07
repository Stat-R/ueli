import { ArgumentCompleter } from "../argument-completer";
import { SearchResultItem } from "../search-result-item";
import { SpotifySearcher } from "../searcher-online/spotify-searcher";

export class SpotifyCompleter implements ArgumentCompleter {
    private prefixList = [
        `${SpotifySearcher.prefix}playlist!`,
        `${SpotifySearcher.prefix}album!`,
        `${SpotifySearcher.prefix}artist!`,
        `${SpotifySearcher.prefix}show!`,
        `${SpotifySearcher.prefix}podcast!`,
    ];

    private toCompleteString: string[] = [];

    public isCompletable(userInput: string, _cavetPosition: number, _selectingResult?: SearchResultItem): boolean {
        this.toCompleteString.length = 0;

        for (const prefix of this.prefixList) {
            if (prefix.startsWith(userInput)) {
                this.toCompleteString.push(prefix);
            }
        }

        if (this.toCompleteString.length > 0) {
            return true;
        }

        return false;
    }

    public complete(_userInput: string,  _cavetPosition: number, _selectingResult?: SearchResultItem): string[] {
        return this.toCompleteString;
    }
}
