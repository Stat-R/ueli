import { Executor } from "./executor";

export class ProcessExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = false;

    private bringToTop: (hwnd: number) => void;

    constructor(bringToTop: (hwnd: number) => void) {
        this.bringToTop = bringToTop;
    }

    public execute(executionArgument: string): void {
        const hwnd = parseInt(executionArgument.substring(5), 10);
        this.bringToTop(hwnd);
    }
}
