export interface ExecutionArgumentValidator {
    destruct?: () => void;
    isValidForExecution(executionArgument: string): boolean;
}
