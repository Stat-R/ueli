import { Executor } from "./executor";
import { Taskbar } from "taskbar-node";

export class ProcessExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly logExecution = false;

    public execute(executionArgument: string): void {
        const hwnd = parseInt(executionArgument.substring(5), 10);
        const taskbar = new Taskbar();
        taskbar.bringAppToTop(hwnd);
        taskbar.destruct();
    }
}
