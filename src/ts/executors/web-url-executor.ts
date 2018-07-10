import * as childProcess from "child_process";
import { Injector } from "../injector";
import { Executor } from "./executor";
import { platform } from "os";

export class WebUrlExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = false;

    public execute(url: string): void {
        const command = Injector.getOpenUrlWithDefaultBrowserCommand(platform(), url);
        this.handleCommandExecution(command);
    }

    private handleCommandExecution(command: string): void {
        childProcess.exec(command, (err) => {
            if (err) {
                throw err;
            }
        });
    }
}
