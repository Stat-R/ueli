import { SearchEngine } from "../search-engine";
import { SearchResultItem } from "../search-result-item";

export interface Searcher {
    destruct?: () => void;
    fuzzySearcher?: SearchEngine["search"];
    needSort?: boolean;
    shouldIsolate?: boolean;
    getSearchResult(userInput: string, cwd: string | undefined): Promise<SearchResultItem[]>;
}
