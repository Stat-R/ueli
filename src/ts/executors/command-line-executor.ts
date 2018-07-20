import { Executor } from "./executor";
import { CommandLineHelpers } from "../helpers/command-line-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { IpcChannels } from "../ipc-channels";
import { spawn, SpawnOptions } from "child_process";
import { ipcMain } from "electron";
// import { platform } from "os";e

export class CommandLineExecutor implements Executor {
    public readonly hideAfterExecution = false;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = false;
    private commandHistory: string[];

    constructor() {
        this.commandHistory = [];
    }

    public execute(executionArgument: string): void {
        this.commandHistory.push(executionArgument);

        const command = CommandLineHelpers.buildCommand(executionArgument);

        const clOptions: SpawnOptions = {
            env: process.env,
        };

        ipcMain.emit(IpcChannels.setLoadingIcon);

        const commandLineTool = spawn(command.name, command.args, clOptions);

        commandLineTool.on("error", (err) => {
            this.sendCommandLineOutputToRenderer(err.message);
        });

        commandLineTool.stderr.on("data", (data) => {
            this.sendCommandLineOutputToRenderer(data.toString());
        });

        commandLineTool.stdout.on("data", (data) => {
            this.sendCommandLineOutputToRenderer(data.toString());
        });

        commandLineTool.on("exit", (code) => {
            ipcMain.emit(IpcChannels.setModeIcon, Icons.SEARCH);
            this.sendCommandLineOutputToRenderer(`Exit ${code}`);
        });

        ipcMain.on(IpcChannels.exitCommandLineTool, () => {
            commandLineTool.kill();
        });
    }

    private sendCommandLineOutputToRenderer(data: string): void {
        ipcMain.emit(IpcChannels.commandLineExecution, data);
    }

}
