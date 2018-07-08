import { ExecutionArgumentValidator } from "./execution-argument-validator";

export class ProcessExecutionArgumentValidator implements ExecutionArgumentValidator {
    private hwndPrefix = "HWND:";

    public isValidForExecution(executionArgument: string): boolean {
        return executionArgument.startsWith(this.hwndPrefix)
            && executionArgument.length > this.hwndPrefix.length;
    }
}
