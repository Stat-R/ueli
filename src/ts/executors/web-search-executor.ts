import { Executor } from "./executor";
import { WebSearchHelpers } from "../helpers/web-search-helper";
import { WebSearch } from "../web-search";
import { shell } from "electron";

export class WebSearchExecutor implements Executor {
    public readonly hideAfterExecution = true;
    public readonly logExecution = false;

    private webSearches: WebSearch[];

    constructor(webSearches: WebSearch[]) {
        this.webSearches = webSearches;
    }

    public execute(executionArgument: string): void {
        for (const webSearch of this.webSearches) {
            if (executionArgument.startsWith(`${webSearch.prefix}${WebSearchHelpers.webSearchSeparator}`)) {
                shell.openExternal(executionArgument);
                return;
            }
        }
    }
}
