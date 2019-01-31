import { StringHelpers } from "./helpers/string-helpers";
import { Icons } from "./icon-manager/icon-manager";
import { SearchResultItem } from "./search-result-item";
import { NativeUtil, EverythingResult } from "./native-lib";
import { readFileSync } from "fs";
import { GlobalUELI } from "./global-ueli";
import { FileHelpers } from "./helpers/file-helpers";

interface Filters {
    [key: string]: {
        matchOptions: number;
        name: string;
        prefix: string;
    };
}

enum OptionsValue {
    CASE = 0x00000001,
    WHOLEWORD = 0x00000002,
    PATH = 0x00000004,
    REGEX = 0x00000008,
    ACCENTS = 0x00000010,
}

const prefixRegex = /^[cCwWpPaAr]\!/;

type Prefix = "c!" | "C!" | "w!" | "W!" | "p!" | "P!" | "a!" | "A!" | "r!";

enum PrefixTranslate {
    "c!" = "Case",
    "C!" = "No case",
    "w!" = "Whole word",
    "W!" = "No whole word",
    "p!" = "Path",
    "P!" = "No path",
    "a!" = "Accents",
    "A!" = "No accents",
    "r!" = "RegExp",
}

export class EverythingInputValidationService {
    private nativeUtil: NativeUtil;
    private maxResults: number;
    private filters: Filters | undefined;
    private filterPrefixes: string[] = [];

    constructor(globalUeli: GlobalUELI) {
        this.nativeUtil = globalUeli.nativeUtil;
        this.maxResults = globalUeli.config.maxTotalSearchResult;

        if (globalUeli.config.everythingFilterFilePath) {
            this.filters = this.parseFilterCSV(globalUeli.config.everythingFilterFilePath);

            if (this.filters) {
                this.filterPrefixes = Object.keys(this.filters).map((filterName) => `${filterName}:`);
            }
        }
    }

    public getSearchResult(userInput: string, cwd: string | undefined): Promise<SearchResultItem[]> {
        return new Promise((resolve) => {
            userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

            if (!this.nativeUtil || !userInput) {
                resolve([]);
                return;
            }

            let matchCase: boolean | null = null;
            let matchWholeWord: boolean | null = null;
            let matchPath: boolean | null = null;
            let matchAccents: boolean | null = null;
            let regExp: boolean | null = null;

            while (true) {
                const prefix = userInput.match(prefixRegex);

                if (!prefix || prefix.length < 1) {
                    break;
                }

                switch (prefix[0]) {
                    case "c!": matchCase = true; break;
                    case "C!": matchCase = false; break;
                    case "w!": matchWholeWord = true; break;
                    case "W!": matchWholeWord = false; break;
                    case "p!": matchPath = true; break;
                    case "P!": matchPath = false; break;
                    case "a!": matchAccents = true; break;
                    case "A!": matchAccents = false; break;
                    case "r!": regExp = true; break;
                }

                userInput = userInput.substring(2);
            }

            let matchOptions = 0x00000000;

            const filterPrefix = userInput.match(/^(.+?)\:/);
            if (
                filterPrefix &&
                this.filters &&
                this.filters[filterPrefix[1]]
            ) {
                userInput = userInput.substring(filterPrefix[0].length);

                const filter = this.filters[filterPrefix[1]];
                userInput = `${filter.prefix} ${userInput}`;

                matchOptions = filter.matchOptions;
            }

            matchOptions = this.mergeOptions(matchOptions, matchCase, OptionsValue.CASE);
            matchOptions = this.mergeOptions(matchOptions, matchWholeWord, OptionsValue.WHOLEWORD);
            matchOptions = this.mergeOptions(matchOptions, matchPath, OptionsValue.PATH);
            matchOptions = this.mergeOptions(matchOptions, matchAccents, OptionsValue.ACCENTS);
            matchOptions = this.mergeOptions(matchOptions, regExp, OptionsValue.REGEX);

            if (cwd) {
                userInput = `${cwd} ${userInput}`;
            }

            this.nativeUtil.queryEverything(
                userInput,
                this.maxResults,
                matchOptions,
                (rawResults: EverythingResult[]) => {
                    const results: SearchResultItem[] = [];

                    rawResults.forEach((rawResult) => results.push({
                        breadCrumb: FileHelpers.filePathToBreadCrumbs(rawResult.path),
                        executionArgument: rawResult.path,
                        icon: rawResult.isDir ? Icons.FOLDER : Icons.FILE,
                        name: this.styleUnderline(rawResult.name),
                    }));

                    resolve(results);
                },
            );
        });
    }

    public getScopes(userInput: string): string[] {
        const scopes = [] as string[];
        let storedPrefix = "";
        while (true) {
            const prefix = userInput.match(prefixRegex);

            if (!prefix || prefix.length < 1) {
                break;
            }

            const option = prefix[0] as Prefix;
            this.addScope(scopes, PrefixTranslate[option]);

            storedPrefix += option;
            userInput = userInput.substring(2);
        }

        const filterPrefix = userInput.match(/^(.+?)\:/);
        if (
            filterPrefix &&
            this.filters &&
            this.filters[filterPrefix[1]]
        ) {
            scopes.push(`Filter ${this.filters[filterPrefix[1]].name || filterPrefix[1]}`);
            storedPrefix += filterPrefix[1] + ":";
            userInput = userInput.substring(storedPrefix.length);
        }
        return [storedPrefix, userInput, ...scopes];
    }

    public complete(userInput: string): string[] {
        if (userInput.length === 0) {
            return this.filterPrefixes;
        }

        const results: string[] = [];
        this.filterPrefixes.forEach((filterName) => {
            if (filterName.startsWith(userInput)) {
                results.push(filterName);
            }
        });

        return results;
    }

    private addScope(scopeContainer: string[], detail: string) {
        if (scopeContainer.findIndex((value) => value === detail) === -1) {
            scopeContainer.push(detail);
        }
    }

    private parseFilterCSV(filePath: string): Filters | undefined {
        const filter: Filters = {};
        let raw: string;
        try {
            raw = readFileSync(filePath, "utf-8");
        } catch (_e) {
            return;
        }

        const lines = raw.split("\n");
        if (lines.length < 2) {
            return;
        }

        for (let i = 1; i < lines.length; i++) {
            // Name,Case,Whole Word,Path,Diacritics,Regex,Search,Macro,Key
            const line = lines[i].match(/^(.*?),(\d),(\d),(\d),(\d),(\d),(.*?),(.*?),(.*?)\r?$/);
            if (!line) {
                continue;
            }

            const macro = line[8].replace(/\"/g, "");
            if (!macro) {
                continue;
            }

            const matchCase = line[2] === "1" ? OptionsValue.CASE : 0;
            const matchWholeWord = line[3] === "1" ? OptionsValue.WHOLEWORD : 0;
            const matchPath = line[4] === "1" ? OptionsValue.PATH : 0;
            const matchAccents = line[5] === "1" ? OptionsValue.ACCENTS : 0;

            filter[macro] = {
                matchOptions: matchCase | matchWholeWord | matchPath | matchAccents,
                name: line[1].replace(/\"/g, ""),
                prefix: line[7].replace(/\"/g, ""),
            };
        }

        return filter;
    }

    private mergeOptions(current: number, condition: boolean | null, value: number): number {
        if (condition !== null) {
            if (condition) {
                return (current | value);
            } else if (current & value) {
                return (current - value);
            }
        }
        return current;
    }

    private styleUnderline(input: string): string {
        return input.replace(/\*(.+?)\*/g, (_: string, matched: string) => {
            return `<span class="highlight">${matched}</span>`;
        });
    }
}
