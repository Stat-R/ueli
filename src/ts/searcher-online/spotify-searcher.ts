import { SearcherOnline } from "./searcher";
import { SearchResultItem } from "../search-result-item";
import { WebSocketSearcher } from "../music-player-websocket";

export class SpotifySearcher implements SearcherOnline {
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
                        icon: `<img src="${item.image}" width="30" height="30"></img>`,
                        name: item.name,
                        tags: [],
                    } as SearchResultItem)));
                });
        });
    }
}
