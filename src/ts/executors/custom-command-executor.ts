import { CommandLineExecutor } from "./command-line-executor";
import { Executor } from "./executor";
import { UeliHelpers } from "../helpers/ueli-helpers";
import { exec } from "child_process";
import { dialog } from "electron";

export class CustomCommandExecutor implements Executor {
    public hideAfterExecution = true;
    public readonly logExecution = true;
    private commandLineExecutor: CommandLineExecutor;

    constructor(commandLineExecutor: CommandLineExecutor) {
        this.commandLineExecutor = commandLineExecutor;
    }

    public execute(executionArgument: string, _: boolean, cwd: string | undefined): void {
        executionArgument = executionArgument.replace(UeliHelpers.customCommandPrefix, "");
        if (executionArgument.startsWith(">")) {
            this.hideAfterExecution = false;
            this.commandLineExecutor.execute(executionArgument, false, cwd);
            return;
        }

        this.hideAfterExecution = true;
        exec(executionArgument, (err: Error): void => {
            if (err) {
                dialog.showErrorBox("Execute file/folde path", err.stack || err.message);
            }
        });
    }
}
