import { SearchResultItem } from "./search-result-item";

export interface ArgumentCompleter {
    isCompletable: (userInput: string, cavetPosition: number, selectingResult: SearchResultItem) => boolean;
    complete: (userInput: string, cavetPosition: number, selectingResult: SearchResultItem) => string[];
    destruct?: () => void;
}
