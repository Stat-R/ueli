import { SearchResultItem } from "../search-result-item";
import { Searcher } from "./searcher";
import { Icons } from "../icon-manager/icon-manager";

export class WebUrlSearcher implements Searcher {
    public readonly needSort = false;
    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const url = userInput.startsWith("http://") || userInput.startsWith("https://")
            ? userInput
            : `http://${userInput}`;

        return [
            {
                executionArgument: url,
                icon: Icons.URL,
                name: "Open default browser",
            } as SearchResultItem,
        ];
    }
}
