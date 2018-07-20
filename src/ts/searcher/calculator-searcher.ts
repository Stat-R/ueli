import { Searcher } from "./searcher";
import { Icons } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";
import * as math from "mathjs";

export class CalculatorSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = true;

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const result = math.eval(userInput);
        return [
            {
                executionArgument: "",
                icon: Icons.CALCULATOR,
                name: `= ${result}`,
            } as SearchResultItem,
        ];
    }
}
