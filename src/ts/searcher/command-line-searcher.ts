import { Searcher } from "./searcher";
import { CommandLineHelpers } from "../helpers/command-line-helpers";
import { StringHelpers } from "../helpers/string-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { SearchEngine } from "../search-engine";
import { BareSearchResultItem, SearchResultItem } from "../search-result-item";
import { execFile, execFileSync } from "child_process";
import { FileHelpers, FancyFile } from "../helpers/file-helpers";
import { basename } from "path";

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

    public async getSearchResult(userInput: string, cwd: string | undefined): Promise<SearchResultItem[]> {
        const command = userInput.replace(CommandLineHelpers.commandLinePrefix, "");
        if (command.length === 0) {
            return [];
        }

        // Search available parameters of command
        const words = StringHelpers.stringToWords(command, false);
        if (words.length === 1) {
            // Search available commands
            const matchedCommand = this.searchEngine.search(this.programList, command);

            if (matchedCommand.length > 0) {
                return matchedCommand.map((item) => ({
                    executionArgument: `${CommandLineHelpers.commandLinePrefix}${item.name}`,
                    icon: Icons.COMMANDLINE,
                    name: item.name,
                } as SearchResultItem));
            }
        } else if (words.length > 1) {
            const lastWord = words.pop() as string;
            if (lastWord.startsWith("-")) {
                const baseCommand = words[0];
                const parameters: BareSearchResultItem[] = this.getCommandParameter(baseCommand);

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

                    if (matchedPara.length > 0) {
                        return matchedPara.map((item: BareSearchResultItem) => ({
                            executionArgument: `${CommandLineHelpers.commandLinePrefix}${words.join(" ")} -${item.name}`,
                            icon: Icons.COMMANDLINE,
                            name: `-${item.name}`,
                        }) as SearchResultItem);
                    }
                }
            // Exclude the case user want to run command in current folder with only a dot
            } else if (lastWord !== "." && cwd) {
                const fileList = (await FileHelpers.getFilesFromFolder({
                    breadCrumb: [],
                    fullPath: cwd,
                })).map((item: FancyFile) => {
                    const base = basename(item.fullPath);
                    return {
                        executionArgument: `${CommandLineHelpers.commandLinePrefix}${words.join(" ")} .\\${base}`,
                        icon: Icons.COMMANDLINE,
                        name: base,
                    } as SearchResultItem;
                });

                if (lastWord) {
                    const filteredFile = this.searchEngine.search(fileList, lastWord);
                    if (filteredFile.length > 0) {
                        return filteredFile;
                    }
                } else {
                    return fileList;
                }
            }
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

    private getCommandParameter(baseCommand: string): BareSearchResultItem[] {
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
                return this.cachedParameters[baseCommand] = paraList.map((item) => ({
                    name: item,
                }) as BareSearchResultItem);
            } catch (_e) {
                return [];
            }
        }

        return this.cachedParameters[baseCommand];
    }
}
