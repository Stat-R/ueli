import { ExecutionArgumentValidator } from "./execution-argument-validator";
import { FilePathRegex } from "../helpers/file-path-regex";

export class FilePathExecutionArgumentValidator implements ExecutionArgumentValidator {
    public isValidForExecution(executionArgument: string): boolean {
        return FilePathRegex.windowsFilePathRegExp.test(executionArgument);
    }
}
