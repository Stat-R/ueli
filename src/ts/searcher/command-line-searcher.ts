import { Searcher } from "./searcher";
import { CommandLineHelpers } from "../helpers/command-line-helpers";
import { StringHelpers } from "../helpers/string-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { SearchEngine } from "../search-engine";
import { BareSearchResultItem, SearchResultItem } from "../search-result-item";
import { execFile, execFileSync } from "child_process";

export class CommandLineSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = true;

    private programList: BareSearchResultItem[];
    private cachedParameters: { [key: string]: BareSearchResultItem[] };
    private searchEngine: SearchEngine;
    private powerShellPath: string;

    constructor(powerShellPath: string) {
        this.programList = [];
        this.cachedParameters = {};
        this.searchEngine = new SearchEngine();
        this.powerShellPath = powerShellPath;
        execFile(this.powerShellPath, [
            "-Command",
            `Get-Command -Type All | ForEach-Object { $_.Name }`,
        ], (error, stdout) => {
            if (error) {
                return;
            }
            this.programList = stdout.split("\r\n").map((item) => {
                if (item.toLocaleLowerCase().endsWith(".exe")) {
                    item = item.substr(0, item.length - 4);
                }
                return {
                    name: item,
                } as BareSearchResultItem;
            });
        });
    }

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const command = userInput.replace(CommandLineHelpers.commandLinePrefix, "");
        if (command.length === 0) {
            return [];
        }

        // Search available parameters of command
        const words = StringHelpers.stringToWords(command);
        if (words.length > 1) {
            const lastWord = words.pop();
            if (lastWord && lastWord.startsWith("-")) {
                const baseCommand = words[0];
                let parameters: BareSearchResultItem[] = [];

                if (this.cachedParameters[baseCommand] === undefined) {
                    try {
                        const result = execFileSync(this.powerShellPath, [
                            "-Command",
                            `(Get-Command -Name '${baseCommand}').Parameters.Keys`,
                        ]);

                        const paraList = result.toString().split("\r\n");

                        if (paraList && paraList.length === 1 && paraList[0] === "") {
                            paraList.length = 0;
                        }
                        parameters = this.cachedParameters[baseCommand] = paraList.map((item) => ({
                            name: item,
                        }) as BareSearchResultItem);
                    } catch (_e) {
                        // Nah
                    }
                } else {
                    parameters = this.cachedParameters[baseCommand];
                }

                if (parameters.length > 0) {
                    const paraInput = lastWord.replace(/^\-/, "");
                    if (paraInput.length === 0) {
                        return parameters.map((item: BareSearchResultItem) => ({
                            executionArgument: `${CommandLineHelpers.commandLinePrefix}${words.join(" ")} -${item.name}`,
                            icon: Icons.COMMANDLINE,
                            name: `-${item.name}`,
                        }) as SearchResultItem);
                    }

                    const matchedPara = this.searchEngine.search(parameters, paraInput);

                    return matchedPara.map((item: BareSearchResultItem) => ({
                        executionArgument: `${CommandLineHelpers.commandLinePrefix}${words.join(" ")} -${item.name}`,
                        icon: Icons.COMMANDLINE,
                        name: `-${item.name}`,
                    }) as SearchResultItem);
                }
            }
        }

        // Search available commands
        const matched = this.searchEngine.search(this.programList, command);

        if (matched.length > 0) {
            return matched.map((item) => ({
                executionArgument: `${CommandLineHelpers.commandLinePrefix}${item.name}`,
                icon: Icons.COMMANDLINE,
                name: item.name,
            } as SearchResultItem));
        }

        return [
            {
                executionArgument: userInput,
                hideDescription: true,
                icon: Icons.COMMANDLINE,
                name: command,
            } as SearchResultItem,
        ];
    }
}
