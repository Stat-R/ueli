import { Executor } from "./executor";

export class SpotifyExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = false;

    private sender: (c: string) => void;

    constructor(sender: (c: string) => void) {
        this.sender = sender;
    }

    public execute(executionArgument: string, alternative: boolean): void {
        if (alternative) {
            executionArgument = `${executionArgument}:QUEUE`;
        }
        this.sender(executionArgument);
    }
}
