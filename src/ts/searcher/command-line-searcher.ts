import { Searcher } from "./searcher";
import { StringHelpers } from "../helpers/string-helpers";
import { Icons } from "../icon-manager/icon-manager";
import { SearchEngine } from "../search-engine";
import { BareSearchResultItem, SearchResultItem } from "../search-result-item";
import { execFile, execFileSync } from "child_process";
import { basename, dirname } from "path";
import { FilePathRegex } from "../helpers/file-path-regex";
import { NativeUtil } from "../native-lib";

export class CommandLineSearcher implements Searcher {
    public readonly needSort = false;
    public readonly shouldIsolate = true;

    private readonly filePathRegex: RegExp = FilePathRegex.windowsFilePathRegExp;
    private programList: BareSearchResultItem[];
    private cachedParameters: { [key: string]: BareSearchResultItem[] };
    private searchEngine: SearchEngine;
    private powerShellPath: string;
    private nativeUtil: NativeUtil;

    constructor(powerShellPath: string, nativeUtil: NativeUtil) {
        this.programList = [];
        this.cachedParameters = {};
        this.searchEngine = new SearchEngine();
        this.powerShellPath = powerShellPath;
        this.nativeUtil = nativeUtil;

        execFile(this.powerShellPath, [
            "-Command",
            `Get-Command -Type All | ForEach-Object Name`,
        ], (error, stdout) => {
            if (error) {
                return;
            }
            this.programList = stdout.split("\r\n").map((item) => {
                if (item.toLowerCase().endsWith(".exe")) {
                    item = item.substr(0, item.length - 4);
                }
                return {
                    name: item,
                } as BareSearchResultItem;
            });
        });
    }

    public async getSearchResult(userInput: string, cwd: string | undefined): Promise<SearchResultItem[]> {
        const command = userInput.substring(1);
        if (command.length === 0) {
            return [];
        }

        const pipes = command.split(/\|/g)
            .map((p) => p.trimLeft());

        const lastPipe = pipes.pop();

        if (!lastPipe) {
            return [];
        }

        const words = StringHelpers.stringToWords(lastPipe, false);
        let argPrefix = `>${pipes.join(" | ")}`;
        if (pipes.length > 0) {
            argPrefix += " | ";
        }

        let results = [] as SearchResultItem[];
        if (words.length === 1) {
            // Search available commands
            const matchedCommand = this.searchEngine.search(this.programList, words[0]);

            if (matchedCommand.length > 0) {
                results = matchedCommand.map((item) => ({
                    executionArgument: `${argPrefix}${item.name}`,
                    icon: Icons.COMMANDLINE,
                    name: item.name,
                } as SearchResultItem));
            }

        } else if (words.length > 1) {
            const lastWord = words.pop() as string;
            argPrefix += words.join(" ");
            if (lastWord.startsWith("-")) {
                results = this.itemsFromParameter(argPrefix, words[0], lastWord);

            // Exclude the case user want to run command in current folder
            // with only a dot
            } else if (lastWord !== "." && cwd) {
                results = this.itemsFromCwd(argPrefix, lastWord, cwd);

            } else if (this.filePathRegex.test(lastWord)) {
                results = this.itemsFromPath(argPrefix, lastWord);
            }
        }

        results.push({
            executionArgument: userInput,
            hideDescription: true,
            icon: Icons.COMMANDLINE,
            name: command,
        } as SearchResultItem);

        return results;
    }

    private getCommandParameter(baseCommand: string): BareSearchResultItem[] {
        if (this.cachedParameters[baseCommand]) {
            return this.cachedParameters[baseCommand];
        }

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

    private itemsFromParameter(argPrefix: string, command: string, input: string): SearchResultItem[] {
        let parameters: BareSearchResultItem[] = this.getCommandParameter(command);

        if (parameters.length > 0) {
            // Remove "-" char
            const paraInput = input.substring(1);
            if (paraInput.length > 0) {
                parameters = this.searchEngine.search(parameters, paraInput);
            }
        }

        return parameters.map((item) => ({
            executionArgument: `${argPrefix} -${item.name}`,
            icon: Icons.COMMANDLINE,
            name: `-${item.name}`,
        }) as SearchResultItem);
    }

    private getFileList(argPrefix: string, directory: string, searchTerm: string): SearchResultItem[] {
        const results = this.nativeUtil.iterateFolder(directory)
            .map((item) => ({
                executionArgument: `${argPrefix} ${item.path()}`,
                icon: Icons.COMMANDLINE,
                name: item.name(),
            } as SearchResultItem));

        if (searchTerm) {
            return this.searchEngine.search(results, searchTerm);
        }

        return results;
    }

    private itemsFromCwd(argPrefix: string, input: string, cwd: string): SearchResultItem[] {
        const findSlash = input.lastIndexOf("\\");
        if (findSlash > 0) {
            const dir = dirname(input);
            cwd += dir;
            input = input.substring(dir.length);
        }

        return this.getFileList(argPrefix, cwd, input);
    }

    private itemsFromPath(argPrefix: string, input: string): SearchResultItem[] {
        const dir = dirname(input);
        const base = basename(input);

        return this.getFileList(argPrefix, dir, base);
    }
}
