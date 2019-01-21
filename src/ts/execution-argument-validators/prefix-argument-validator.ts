import { ExecutionArgumentValidator } from "./execution-argument-validator";

export class PrefixArgumentValidator implements ExecutionArgumentValidator {
    private prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    public isValidForExecution(executionArgument: string): boolean {
        return executionArgument.startsWith(this.prefix) &&
            executionArgument.length > this.prefix.length;
    }
}
