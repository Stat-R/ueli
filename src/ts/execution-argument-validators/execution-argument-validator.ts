export interface ExecutionArgumentValidator {
    isValidForExecution(executionArgument: string): boolean;
    destruct?: () => void;
}
