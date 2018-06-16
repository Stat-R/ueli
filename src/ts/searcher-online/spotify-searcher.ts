import { SearcherOnline } from "./searcher";
import { SearchResultItem } from "../search-result-item";
import { WebSocketSearcher } from "../music-player-websocket";

export class SpotifySearcher implements SearcherOnline {
    private searcher: WebSocketSearcher;
    constructor(search: WebSocketSearcher) {
        this.searcher = search;
    }

    public getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        return new Promise<SearchResultItem[]>((resolve) => {
            this.searcher(userInput)
                .then((result) => {
                    resolve(result.map((item) => ({
                        breadCrumb: [item.artist],
                        executionArgument: item.url,
                        icon: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" version="1.1">
                                    <g id="surface1">
                                        <path d=" M 15 1 C 7.268 1 1 7.268 1 14.999 C 1 22.731 7.268 28.999 15 28.999 C 22.732 28.999 29 22.731 29 14.999 C 29 7.268 22.732 1 15 1 Z  M 20.68 21.606 C 20.453 21.606 20.299 21.527 20.087 21.398 C 18.058 20.171 15.528 19.526 12.843 19.526 C 11.345 19.526 9.837 19.718 8.427 20.011 C 8.198 20.061 7.909 20.15 7.737 20.15 C 7.205 20.15 6.851 19.727 6.851 19.27 C 6.851 18.681 7.19 18.389 7.612 18.308 C 9.342 17.914 11.064 17.689 12.852 17.689 C 15.916 17.689 18.646 18.392 20.996 19.8 C 21.345 20.004 21.55 20.212 21.55 20.73 C 21.55 21.235 21.14 21.606 20.68 21.606 Z  M 22.205 17.9 C 21.901 17.9 21.71 17.778 21.504 17.658 C 19.226 16.306 16.07 15.408 12.614 15.408 C 10.841 15.408 9.311 15.656 8.044 15.994 C 7.771 16.069 7.618 16.15 7.363 16.15 C 6.761 16.15 6.269 15.659 6.269 15.052 C 6.269 14.457 6.558 14.047 7.14 13.883 C 8.714 13.45 10.321 13.117 12.66 13.117 C 16.325 13.117 19.87 14.03 22.657 15.698 C 23.124 15.966 23.296 16.306 23.296 16.804 C 23.296 17.411 22.814 17.9 22.205 17.9 Z  M 23.942 13.591 C 23.657 13.591 23.488 13.522 23.221 13.375 C 20.687 11.856 16.754 11.019 12.951 11.019 C 11.053 11.019 9.124 11.212 7.358 11.691 C 7.155 11.743 6.898 11.844 6.64 11.844 C 5.894 11.844 5.321 11.254 5.321 10.507 C 5.321 9.746 5.792 9.319 6.301 9.169 C 8.297 8.581 10.524 8.307 12.946 8.307 C 17.057 8.307 21.382 9.152 24.541 11.008 C 24.967 11.249 25.263 11.613 25.263 12.279 C 25.263 13.042 24.649 13.591 23.942 13.591 Z "></path>
                                    </g>
                                </svg>`,
                        name: item.name,
                        tags: [],
                    } as SearchResultItem)));
                });
        });
    }
}
