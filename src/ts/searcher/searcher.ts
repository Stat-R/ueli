import { SearchResultItem } from "../search-result-item";

export interface Searcher {
    needSort: boolean;
    getSearchResult(userInput: string): Promise<SearchResultItem[]>;
}
