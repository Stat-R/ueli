import { Executor } from "./executor";
import { Icons } from "../icon-manager/icon-manager";
import { IpcChannels } from "../ipc-channels";
import { spawn, SpawnOptions } from "child_process";
import { ipcMain } from "electron";
import { homedir } from "os";

export class CommandLineExecutor implements Executor {
    public readonly hideAfterExecution = false;
    public readonly logExecution = false;
    private shellPath: string;

    constructor(shellPath: string) {
        this.shellPath = shellPath;
    }

    public execute(executionArgument: string, _: boolean, cwd: string | undefined): void {
        executionArgument = executionArgument.substring(1);
        const clOptions: SpawnOptions = {
            cwd: cwd || homedir(),
            env: process.env,
        };

        ipcMain.emit(IpcChannels.setLoadingIcon);

        const commandLineTool = spawn(this.shellPath, [executionArgument], clOptions);

        commandLineTool.on("error", (err) => {
            this.sendCommandLineOutputToRenderer(err.message);
        });

        commandLineTool.stderr.on("data", (data) => {
            this.sendCommandLineOutputToRenderer(data.toString());
        });

        commandLineTool.stdout.on("data", (data: Buffer) => {
            this.sendCommandLineOutputToRenderer(data.toString());
        });

        commandLineTool.on("exit", (code) => {
            ipcMain.emit(IpcChannels.setModeIcon, Icons.SEARCH);
            this.sendCommandLineOutputToRenderer(`Exit ${code}`);
        });
    }

    private sendCommandLineOutputToRenderer(data: string): void {
        ipcMain.emit(IpcChannels.commandLineExecution, data);
    }

}
