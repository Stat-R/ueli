import { Executor } from "./executor";
import { exec } from "child_process";
import { UeliHelpers } from "../helpers/ueli-helpers";

export class SpotifyExecutor implements Executor {
    private sender: (c: string) => void;

    constructor(sender: (c: string) => void) {
        this.sender = sender;
    }

    public execute(executionArgument: string): void {
        this.sender(executionArgument);
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
