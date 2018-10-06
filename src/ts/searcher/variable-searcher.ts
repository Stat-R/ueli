import { Searcher } from "./searcher";
import { FileHelpers } from "../helpers/file-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { FilePathInputValidator } from "../input-validators/file-path-input-validator";
import { BareSearchResultItem, SearchResultItem } from "../search-result-item";

export class VariableSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = true;

    private collection: SearchResultItem[];

    constructor() {
        this.collection = [];
        const env = process.env as { [key: string]: string };

        const validator = new FilePathInputValidator();

        for (const varName of Object.keys(env)) {
            const value = env[varName];
            if (validator.isValidForSearchResults(value)) {
                this.collection.push({
                    breadCrumb: FileHelpers.filePathToBreadCrumbs(value),
                    executionArgument: value,
                    icon: Icons.VARIABLE,
                    name: varName,
                });
            }
        }
    }

    public fuzzySearcher<T extends BareSearchResultItem | SearchResultItem>(_unsortedSearchResults: T[], _searchTerm: string): T[] {
        return [];
    }

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        userInput = userInput.substr(1);

        if (userInput.length === 0) {
            return this.collection;
        }

        return this.fuzzySearcher(this.collection, userInput);
    }
}
