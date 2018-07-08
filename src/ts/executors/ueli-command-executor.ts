import { ipcMain } from "electron";
import { Executor } from "./executor";

export class UeliCommandExecutor implements Executor {
    public readonly hideAfterExecution = false;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = false;

    public execute(command: string): void {
        ipcMain.emit(command);
    }
}
