import { SearchResultItem } from "../search-result-item";
import { Searcher } from "./searcher";
import * as math from "mathjs";
import { Icons } from "../icon-manager/icon-manager";

export class CalculatorSearcher implements Searcher {
    public readonly needSort = false;

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const result = math.eval(userInput);
        return [
            {
                executionArgument: "",
                icon: Icons.CALCULATOR,
                name: `= ${result}`,
                tags: [],
            } as SearchResultItem,
        ];
    }
}
