import { ArgumentCompleter } from "../argument-completer";
import { FilePathExecutionArgumentValidator } from "../execution-argument-validators/file-path-execution-argument-validator";
import { SearchResultItem } from "../search-result-item";
import { lstatSync } from "fs";

export class FilePathCompleter implements ArgumentCompleter {
    private isValidFilePath = new FilePathExecutionArgumentValidator().isValidForExecution;
    private dirSeparator = "\\";

    public isCompletable(_userInput: string, _cavetPosition: number, selectingResult?: SearchResultItem): boolean {
        if (selectingResult) {
            return this.isValidFilePath(selectingResult.executionArgument);
        }

        return false;
    }

    public complete(_userInput: string,  _cavetPosition: number, selectingResult?: SearchResultItem): string[] {
        if (selectingResult) {
            const arg = selectingResult.executionArgument;
            if (!arg.endsWith(this.dirSeparator)
             && lstatSync(arg).isDirectory()) {
                return [`${arg}${this.dirSeparator}`];
            }

            return [arg];
        }

        return [];
    }
}
