import * as LibTypes from "./lib-types";
const binary = require("./nbind.node");

const lib = binary as {
    NativeUtil: typeof LibTypes.NativeUtil;
}

export class NativeUtil {
    private instance: LibTypes.NativeUtil;

    constructor() {
        this.instance = new lib.NativeUtil();
    }

    public storeBrowserHwnd(): void {
        this.instance.storeBrowserHwnd();
    }

    public elevateExecute(arg: string): void {
        this.instance.elevateExecute(arg);
    }

    public queryEverything(query: string, maxResults: number, matchOptions: number): void {
        this.instance.queryEverything(query, maxResults, matchOptions);
    }

    public resolveEverything(): Array<string[]> {
        return this.instance.resolveEverything();
    }

    public activateContextMenu(filePath: string): void {
        this.instance.activateContextMenu(filePath);
    }
}