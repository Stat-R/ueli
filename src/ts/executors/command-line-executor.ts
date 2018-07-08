import { spawn, SpawnOptions } from "child_process";
import { ipcMain } from "electron";
import { CommandLineHelpers } from "./../helpers/command-line-helpers";
import { Executor } from "./executor";
import { IpcChannels } from "../ipc-channels";
import { platform } from "os";
import { Icons } from "../icon-manager/icon-manager";

export class CommandLineExecutor implements Executor {
    public readonly hideAfterExecution = false;
    public readonly resetUserInputAfterExecution = true;
    public readonly logExecution = false;

    public execute(executionArgument: string): void {
        const command = CommandLineHelpers.buildCommand(executionArgument);

        const clOptions: SpawnOptions = {
            env: process.env,
        };

        switch (platform()) {
            case "win32":
                clOptions.shell = process.env.ComSpec;
                break;
        }

        ipcMain.emit(IpcChannels.getSearchIcon, Icons.LOADING);

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
            ipcMain.emit(IpcChannels.getSearchIcon, Icons.SEARCH);
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
