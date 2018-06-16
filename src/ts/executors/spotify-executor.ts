import { Executor } from "./executor";
import { exec } from "child_process";
import { UeliHelpers } from "../helpers/ueli-helpers";

export class SpotifyExecutor implements Executor {
    public execute(executionArgument: string): void {
        executionArgument = `start ${executionArgument}#0:1`;
        exec(executionArgument, (err: Error): void => {
            if (err) {
                throw err;
            }
        });
    }

    public hideAfterExecution(): boolean {
        return true;
    }

    public resetUserInputAfterExecution(): boolean {
        return true;
    }

    public logExecution(): boolean {
        return false;
    }
}
