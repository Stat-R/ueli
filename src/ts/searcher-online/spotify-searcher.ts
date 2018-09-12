import { WebSocketSearcher } from "../music-player/music-player-websocket";
import { SearchResultItem } from "../search-result-item";
import { Searcher } from "../searcher/searcher";

export class SpotifySearcher implements Searcher {
    private searcher: WebSocketSearcher;
    constructor(search: WebSocketSearcher) {
        this.searcher = search;
    }

    public getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        userInput = userInput.replace("s!", "");
        return new Promise<SearchResultItem[]>((resolve) => {
            this.searcher(userInput)
                .then((result) => {
                    resolve(result.map((item) => ({
                        breadCrumb: [item.artist],
                        executionArgument: item.url,
                        icon: `<image xlink:href="${item.image}" width="32" height="32"/>`,
                        name: item.name,
                    } as SearchResultItem)));
                })
                .catch(() => resolve([]));
        });
    }
}
