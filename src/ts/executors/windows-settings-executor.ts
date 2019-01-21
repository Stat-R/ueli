import { Executor } from "./executor";
import { WindowsSettingsHelpers } from "../helpers/windows-settings-helpers";
import { shell } from "electron";

export class WindowsSettingsExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly logExecution = true;

    public execute(executionArgument: string): void {
        const command = this.replacePrefix(executionArgument);
        shell.openExternal(command);
    }

    private replacePrefix(executionArgument: string): string {
        return executionArgument.replace(WindowsSettingsHelpers.windowsSettingsPrefix, "");
    }
}
