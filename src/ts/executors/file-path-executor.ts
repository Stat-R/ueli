import * as childProcess from "child_process";
import { Injector } from "../injector";
import { Executor } from "./executor";
import { platform } from "os";
import { ipcMain, dialog } from "electron";
import { IpcChannels } from "../ipc-channels";
import { statSync } from "fs";

export class FilePathExecutor implements Executor {
    public static openFileLocation(filePath: string): void {
        const command = Injector.getFileLocationExecutionCommand(platform(), filePath);
        this.handleExecution(command);
    }

    private static handleExecution(command: string): void {
        childProcess.exec(command, (err) => {
            if (err) {
                dialog.showErrorBox("Execute file/folde path", err.stack || err.message);
            }
        });
    }

    public readonly hideAfterExecution = true;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = true;
    private textEditorPath: string;

    constructor(textEditorPath: string) {
        this.textEditorPath = textEditorPath;
    }

    public execute(filePath: string, alternative = false): void {
        if (alternative) {
            if (statSync(filePath).isDirectory()) {
                this.handleAlternativeExecuteDir(filePath);
            } else {
                this.handleAlternativeExecuteFile(filePath);
            }
        } else {
            const command = Injector.getFileExecutionCommand(platform(), filePath);
            FilePathExecutor.handleExecution(command);
        }
    }

    private handleAlternativeExecuteFile(filePath: string) {
        // TODO: Do something for macOS here
        ipcMain.emit(IpcChannels.elevatedExecute, filePath);
    }

    private handleAlternativeExecuteDir(filePath: string) {
        childProcess.exec(`"${this.textEditorPath}" "${filePath}"`, (err) => {
            if (err) {
                throw err;
            }
        });
    }
}
