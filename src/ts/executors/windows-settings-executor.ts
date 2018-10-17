import { exec } from "child_process";
import { Executor } from "./executor";
import { WindowsSettingsHelpers } from "../helpers/windows-settings-helpers";
import { dialog } from "electron";

export class WindowsSettingsExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = true;

    public execute(executionArgument: string): void {
        const command = this.replacePrefix(executionArgument);

        exec(`start ${command}`, (err): void => {
            if (err) {
                dialog.showErrorBox("Execute file/folde path", err.stack || err.message);
            }
        });
    }

    private replacePrefix(executionArgument: string): string {
        return executionArgument.replace(WindowsSettingsHelpers.windowsSettingsPrefix, "");
    }
}
