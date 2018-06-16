import { SearchResultItem } from "../search-result-item";

export interface SearcherOnline {
    getSearchResult(userInput: string): Promise<SearchResultItem[]>;
}
