import { Searcher } from "./searcher";
import { Icons } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";

export class WebUrlSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = false;

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const url = userInput.startsWith("http://") || userInput.startsWith("https://")
            ? userInput
            : `http://${userInput}`;

        return [
            {
                executionArgument: url,
                icon: Icons.URL,
                hideDescription: true,
                name: "Open default browser",
            } as SearchResultItem,
        ];
    }
}
