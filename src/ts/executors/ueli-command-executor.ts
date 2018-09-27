import { Executor } from "./executor";
import { ipcMain } from "electron";

export class UeliCommandExecutor implements Executor {
    public readonly hideAfterExecution = false;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = true;

    public execute(command: string): void {
        ipcMain.emit(command);
    }
}
