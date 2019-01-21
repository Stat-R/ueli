import { Searcher } from "./searcher";
import { Icons } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";
import { CalculatorInputValidator } from "../input-validators/calculator-input-validator";

export class CalculatorSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = true;
    public validator: CalculatorInputValidator;

    constructor() {
        this.validator = new CalculatorInputValidator;
    }

    public async getSearchResult(_: string): Promise<SearchResultItem[]> {
        return [
            {
                executionArgument: `clipboard:${this.validator.result}`,
                hideDescription: true,
                icon: Icons.CALCULATOR,
                name: `= ${this.styleResult(this.validator.result)}`,
            } as SearchResultItem,
        ];
    }

    private styleResult(input: string): string {
        return input
            // HTML styled "x^y"
            .replace(/\^(\d+)/g, (_: any, num: string) => num.sup());
    }
}
