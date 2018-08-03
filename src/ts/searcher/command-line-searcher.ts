import { Searcher } from "./searcher";
import { CommandLineHelpers } from "../helpers/command-line-helpers";
import { StringHelpers } from "../helpers/string-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { SearchEngine } from "../search-engine";
import { BareSearchResultItem, SearchResultItem } from "../search-result-item";
import { exec, execSync } from "child_process";

export class CommandLineSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = true;

    private programList: BareSearchResultItem[];
    private cachedParameters: { [key: string]: string[] };

    constructor() {
        this.programList = [];
        this.cachedParameters = {};
        exec(`powershell "Get-Command -Type All | ForEach-Object { $_.Name }"`, (error, stdout) => {
            if (error) {
                return;
            }
            this.programList = stdout.split("\r\n").map((item) => {
                if (item.toLocaleLowerCase().endsWith(".exe")) {
                    item = item.substr(0, item.length - 4);
                }
                return {
                    name: item
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
            if (lastWord) {
                const baseCommand = words[0];
                let parameters: string[] = [];

                if (this.cachedParameters[baseCommand] === undefined) {
                    try {
                        let paraList = execSync(
                            `powershell "(Get-Command -Name ${baseCommand}).Parameters.Keys"`)
                            .toString().split("\r\n");
                        if (paraList && paraList.length === 1 && paraList[0] === "") {
                            paraList.length = 0;
                        }
                        parameters = this.cachedParameters[baseCommand] = paraList;
                    } catch (_e) {
                        // Nah
                    }
                } else {
                    parameters = this.cachedParameters[baseCommand];
                }

                if (parameters.length > 0) {
                    const paraInput = lastWord.replace(/^\-/, "").toLowerCase();
                    const matchedPara = parameters
                        .filter((item) => item.toLowerCase().startsWith(paraInput));

                    return matchedPara.map((item) => ({
                        executionArgument: `${CommandLineHelpers.commandLinePrefix}${words.join(" ")} -${item}`,
                        icon: Icons.COMMANDLINE,
                        name: `-${item}`
                    }) as SearchResultItem)
                }
            }
        }

        // Search available commands
        const matched = new SearchEngine().search(this.programList, userInput);

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
                icon: Icons.COMMANDLINE,
                name: command,
            } as SearchResultItem,
        ]
    }
}
