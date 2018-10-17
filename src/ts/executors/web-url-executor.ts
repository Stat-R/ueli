import { Executor } from "./executor";
import { Injector } from "../injector";
import { exec } from "child_process";
import { platform } from "os";
import { dialog } from "electron";

export class WebUrlExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = true;

    public execute(url: string): void {
        const command = Injector.getOpenUrlWithDefaultBrowserCommand(platform(), url);
        this.handleCommandExecution(command);
    }

    private handleCommandExecution(command: string): void {
        exec(command, (err) => {
            if (err) {
                dialog.showErrorBox("Execute file/folde path", err.stack || err.message);
            }
        });
    }
}
