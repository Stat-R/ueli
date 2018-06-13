import { Searcher } from "./searcher";
import { ConfigOptions } from "../config-options";
import { Injector } from "../injector";
import { FilePathInputValidator } from "../input-validators/file-path-input-validator";
import { SearchEngine } from "../search-engine";
import { SearchResultItem } from "../search-result-item";
import { platform } from "os";
import { DirectorySeparator } from "../directory-separator";

export class VariableSearcher implements Searcher {
    private config: ConfigOptions;
    private collection: SearchResultItem[];

    constructor(config: ConfigOptions) {
        this.config = config;
        this.collection = [];
        const env = process.env as { [key: string]: string };

        const validator = new FilePathInputValidator();
        const icon = Injector
            .getIconManager(platform())
            .getVariableIcon();
        for (const varName of Object.keys(env)) {
            const value = env[varName];
            if (validator.isValidForSearchResults(value)) {
                this.collection.push({
                    breadCrumb: value.split(DirectorySeparator.WindowsDirectorySeparator),
                    executionArgument: value,
                    icon,
                    name: `${varName}`,
                    tags: [],
                });
            }
        }
    }

    public getSearchResult(userInput: string): SearchResultItem[] {
        return this.sortSearchResult(this.collection, userInput);
    }

    private sortSearchResult(searchResultItems: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        const searchEngine = new SearchEngine(searchResultItems, this.config.searchEngineThreshold);
        return searchEngine.search(searchTerm);
    }
}
