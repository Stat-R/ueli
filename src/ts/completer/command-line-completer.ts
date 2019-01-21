import { ArgumentCompleter } from "../argument-completer";
import { SearchResultItem } from "../search-result-item";

export class CommandLineCompleter implements ArgumentCompleter {
    public isCompletable(_userInput: string, _cavetPosition: number, selectingResult?: SearchResultItem): boolean {
        if (selectingResult) {
            return selectingResult.executionArgument.startsWith(">");
        }

        return false;
    }

    public complete(_userInput: string, _cavetPosition: number, selectingResult?: SearchResultItem): string[] {
        if (selectingResult) {
            return [`${selectingResult.executionArgument} `];
        }

        return [];
    }
}
