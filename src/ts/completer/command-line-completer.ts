import { ArgumentCompleter } from "../argument-completer";
import { CommandLineExecutionArgumentValidator } from "../execution-argument-validators/command-line-execution-argument-validator";
import { SearchResultItem } from "../search-result-item";

export class CommandLineCompleter implements ArgumentCompleter {
    private isValid = new CommandLineExecutionArgumentValidator().isValidForExecution;
    public isCompletable(_userInput: string, _cavetPosition: number, selectingResult: SearchResultItem): boolean {
        return this.isValid(selectingResult.executionArgument);
    }

    public complete(_userInput: string, _cavetPosition: number, selectingResult: SearchResultItem): string {
        return `${selectingResult.executionArgument} `;
    }
}
