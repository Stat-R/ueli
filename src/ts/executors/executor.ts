export interface Executor {
    destruct?: () => void;
    hideAfterExecution: boolean;
    logExecution: boolean;
    execute(executionArgument: string, alternative: boolean, cwd: string | undefined): void;
}
