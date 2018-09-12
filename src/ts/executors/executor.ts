export interface Executor {
    hideAfterExecution: boolean;
    resetUserInputAfterExecution: boolean;
    logExecution: boolean;
    execute(executionArgument: string, alternative: boolean): void;
    destruct?: () => void;
}
