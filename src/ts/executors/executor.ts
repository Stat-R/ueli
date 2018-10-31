export interface Executor {
    destruct?: () => void;
    hideAfterExecution: boolean;
    resetUserInputAfterExecution: boolean;
    logExecution: boolean;
    execute(executionArgument: string, alternative: boolean, cwd: string | undefined): void;
}
