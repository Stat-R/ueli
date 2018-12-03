import { exec } from "child_process";
import { Executor } from "./executor";
import { ipcMain, dialog, shell } from "electron";
import { IpcChannels } from "../ipc-channels";
import { statSync } from "fs";

export class FilePathExecutor implements Executor {
    public static openFileLocation(filePath: string): void {
        shell.showItemInFolder(filePath);
    }

    private static handleExecution(command: string): void {
        try {
            shell.openItem(command);
        } catch (err) {
            dialog.showErrorBox("Execute file/folder path", err.stack || err.message);
        }
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
            FilePathExecutor.handleExecution(filePath);
        }
    }

    private handleAlternativeExecuteFile(filePath: string) {
        ipcMain.emit(IpcChannels.elevatedExecute, filePath);
    }

    private handleAlternativeExecuteDir(filePath: string) {
        exec(`"${this.textEditorPath}" "${filePath}"`, (err) => {
            if (err) {
                dialog.showErrorBox("Execute file/folde path", err.stack || err.message);
            }
        });
    }
}
