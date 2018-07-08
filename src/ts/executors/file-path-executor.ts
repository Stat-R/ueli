import * as childProcess from "child_process";
import { Injector } from "../injector";
import { Executor } from "./executor";
import { platform } from "os";
import { ipcMain } from "electron";
import { IpcChannels } from "../ipc-channels";

export class FilePathExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = true;

    public execute(filePath: string, alternative = false): void {
        if (alternative) {
            this.handleAlternativeExecute(filePath);
        } else {
            this.handleExecution(filePath);
        }
    }

    public openFileLocation(filePath: string): void {
        const command = Injector.getFileLocationExecutionCommand(platform(), filePath);
        this.handleExecution(command);
    }

    private handleExecution(filePath: string): void {
        const command = Injector.getFileExecutionCommand(platform(), filePath);
        childProcess.exec(command, (err) => {
            if (err) {
                throw err;
            }
        });
    }

    private handleAlternativeExecute(filePath: string) {
        // TODO: Do something for macOS here
        ipcMain.emit(IpcChannels.elevatedExecute, filePath);
    }
}
