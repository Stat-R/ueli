import { Searcher } from "./searcher";
import { FilePathInputValidator } from "../input-validators/file-path-input-validator";
import { SearchResultItem } from "../search-result-item";
import { DirectorySeparator } from "../directory-separator";
import { Icons } from "../icon-manager/icon-manager";

export class VariableSearcher implements Searcher {
    public readonly needSort = true;
    private collection: SearchResultItem[];

    constructor() {
        this.collection = [];
        const env = process.env as { [key: string]: string };

        const validator = new FilePathInputValidator();

        for (const varName of Object.keys(env)) {
            const value = env[varName];
            if (validator.isValidForSearchResults(value)) {
                this.collection.push({
                    breadCrumb: value.split(DirectorySeparator.WindowsDirectorySeparator),
                    executionArgument: value,
                    icon: Icons.VARIABLE,
                    name: `${varName}`,
                });
            }
        }
    }

    public async getSearchResult(): Promise<SearchResultItem[]> {
        return this.collection;
    }
}
