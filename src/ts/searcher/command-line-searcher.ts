import { Searcher } from "./searcher";
import { CommandLineHelpers } from "../helpers/command-line-helpers";
import { StringHelpers } from "../helpers/string-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";
import { exec, execSync } from "child_process";

export class CommandLineSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = true;

    private programList: string[];
    private cachedParameters: { [key: string]: string[] };

    constructor() {
        this.programList = [];
        this.cachedParameters = {};
        exec(`powershell "Get-Command -Type All | ForEach-Object { $_.Name }"`, (error, stdout) => {
            if (error) {
                return;
            }
            this.programList = stdout.split("\r\n");
        });
    }

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const command = userInput.replace(CommandLineHelpers.commandLinePrefix, "");
        if (command.length === 0) {
            return [];
        }
        // Search available commands
        const matched = this.programList
            .filter((item) => item.toLowerCase().startsWith(command.toLowerCase()));
        if (matched.length > 0) {
            return matched.map((item) => ({
                executionArgument: `${CommandLineHelpers.commandLinePrefix}${item}`,
                icon: Icons.COMMANDLINE,
                name: `${item}`,
            } as SearchResultItem));
        }

        // Search available parameters of command
        const words = StringHelpers.stringToWords(command);
        if (words.length > 0) {
            const lastWord = words.pop();
            if (lastWord && lastWord.startsWith("-")) {
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
                    } catch(_e) {
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
        return [
            {
                executionArgument: userInput,
                icon: Icons.COMMANDLINE,
                name: command,
            } as SearchResultItem,
        ]
    }
}
