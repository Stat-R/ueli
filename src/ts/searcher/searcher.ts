import { SearchEngine } from "../search-engine";
import { SearchResultItem } from "../search-result-item";

export interface Searcher {
    needSort: boolean;
    shouldIsolate: boolean;
    getSearchResult(userInput: string): Promise<SearchResultItem[]>;
    fuzzySearcher?: SearchEngine["search"];
}
