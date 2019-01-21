import { Executor } from "./executor";
import { clipboard } from "electron";

export class ClipboardExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly logExecution = false;

    public execute(command: string): void {
        clipboard.writeText(command.substring(10));
    }
}
