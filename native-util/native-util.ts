import * as LibTypes from "./lib-types";
const binary = require("./nbind.node");

const lib = binary as {
    NativeUtil: typeof LibTypes.NativeUtil;
};

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

    public resolveEverything(): string[][] {
        return this.instance.resolveEverything();
    }

    public activateContextMenu(filePath: string): void {
        this.instance.activateContextMenu(filePath);
    }

    public takeScreenshot(width: number, height: number, outFilePath: string): void {
        this.instance.takeScreenshot(width, height, outFilePath);
    }

    public getExplorerPath(): string {
        let rawPath: string = decodeURI(this.instance.getExplorerPath());

        if (rawPath) {
            rawPath = rawPath.replace("file:///", "").replace(/\//g, "\\") + "\\";
        }

        return rawPath;
    }

    public storeLastForegroundWindow(): void {
        this.instance.storeLastFgWindow();
    }
}
