export interface Executor {
    readonly hideAfterExecution: boolean;
    readonly resetUserInputAfterExecution: boolean;
    readonly logExecution: boolean;
    execute(executionArgument: string, alternative: boolean): void;
}
