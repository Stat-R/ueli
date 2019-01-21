import { Executor } from "./executor";
import { shell } from "electron";

export class WebUrlExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly logExecution = true;

    public execute(url: string): void {
        shell.openExternal(url);
    }
}
