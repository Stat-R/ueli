import { StringHelpers } from "./helpers/string-helpers";
import { Icons } from "./icon-manager/icon-manager";
import { SearchResultItem } from "./search-result-item";
import { NativeUtil } from "./native-lib";
import { readFileSync } from "fs";
import { GlobalUELI } from "./global-ueli";

interface EverythingFilter {
    [key: string]: {
        matchOptions: number;
        name: string;
        prefix: string;
    };
}

enum EverythingMatchOptions {
    CASE = 0x00000001,
    WHOLEWORD = 0x00000002,
    PATH = 0x00000004,
    REGEX = 0x00000008,
    ACCENTS = 0x00000010,
}

export class EverythingInputValidationService {
    private nativeUtil: NativeUtil;
    private maxResults: number;
    private filters: EverythingFilter | undefined;
    private filterPrefixes: string[] = [];

    constructor(globalUeli: GlobalUELI) {
        this.nativeUtil = globalUeli.nativeUtil;
        this.maxResults = globalUeli.config.maxSearchResultCount;

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

            let prefix = userInput.match(/^([cCwWpPaAr])\!/);
            while (prefix && prefix[1]) {
                switch (prefix[1]) {
                    case "c": matchCase = true; break;
                    case "C": matchCase = false; break;
                    case "w": matchWholeWord = true; break;
                    case "W": matchWholeWord = false; break;
                    case "p": matchPath = true; break;
                    case "P": matchPath = false; break;
                    case "a": matchAccents = true; break;
                    case "A": matchAccents = false; break;
                    case "r": regExp = true; break;
                }
                userInput = userInput.replace(/^([cCwWpPaAr])\!/, "");
                prefix = userInput.match(/^([cCwWpPaAr])\!/);
            }

            let matchOptions = 0;

            const filterPrefix = userInput.match(/^(.+?)\:/);
            if (filterPrefix
                && this.filters
                && this.filters[filterPrefix[1]]) {
                const filter = this.filters[filterPrefix[1]];
                userInput = userInput.replace(/^.+?\:/, "");
                userInput = `${filter.prefix} ${userInput}`;
                matchOptions = filter.matchOptions;
            }

            matchOptions = this.mergeOptions(matchOptions, matchCase, EverythingMatchOptions.CASE);
            matchOptions = this.mergeOptions(matchOptions, matchWholeWord, EverythingMatchOptions.WHOLEWORD);
            matchOptions = this.mergeOptions(matchOptions, matchPath, EverythingMatchOptions.PATH);
            matchOptions = this.mergeOptions(matchOptions, matchAccents, EverythingMatchOptions.ACCENTS);
            matchOptions = this.mergeOptions(matchOptions, regExp, EverythingMatchOptions.REGEX);

            if (cwd) {
                this.nativeUtil.queryEverything(`${cwd} ${userInput}`, this.maxResults, matchOptions);
            } else {
                this.nativeUtil.queryEverything(userInput, this.maxResults, matchOptions);
            }
            const interval = setInterval(() => {
                const rawList = this.nativeUtil.resolveEverything();

                if (rawList.length === 0) {
                    return;
                }

                const results: SearchResultItem[] = [];
                for (const rawResult of rawList) {
                    results.push({
                        executionArgument: rawResult[1],
                        icon: rawResult[2] === "folder" ? Icons.FOLDER : Icons.FILE,
                        name: rawResult[0],
                    });
                }

                resolve(results);

                clearInterval(interval);
            }, 50);
        });
    }

    public getScopes(userInput: string): string[] {
        const scopes = [] as string[];
        let prefix = userInput.match(/^([cCwWpPaAr])\!/);
        let storedPrefix = "";
        while (prefix && prefix[1]) {
            switch (prefix[1]) {
                case "c": this.addScope(scopes, "Case"); break;
                case "C": this.addScope(scopes, "No case"); break;
                case "w": this.addScope(scopes, "Whole word"); break;
                case "W": this.addScope(scopes, "No whole word"); break;
                case "p": this.addScope(scopes, "Path"); break;
                case "P": this.addScope(scopes, "No path"); break;
                case "a": this.addScope(scopes, "Accents"); break;
                case "A": this.addScope(scopes, "No accents"); break;
                case "r": this.addScope(scopes, "RegExp"); break;
            }
            storedPrefix += prefix[1] + "!";
            userInput = userInput.replace(/^([cCwWpPaAr])\!/, "");
            prefix = userInput.match(/^([cCwWpPaAr])\!/);
        }
        const filterPrefix = userInput.match(/^(.+?)\:/);
        if (filterPrefix
         && this.filters
         && this.filters[filterPrefix[1]]) {
            scopes.push(`Filter: ${this.filters[filterPrefix[1]].name || filterPrefix[1]}`);
            storedPrefix += filterPrefix[1] + ":";
            userInput = userInput.replace(/^.+?\:/, "");
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

    private parseFilterCSV(filePath: string): EverythingFilter | undefined {
        const filter: EverythingFilter = {};
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

            if (line !== null) {
                const macro = line[8].replace(/\"/g, "");
                if (!macro) {
                    continue;
                }
                const matchCase = line[2] === "1" ? EverythingMatchOptions.CASE : 0;
                const matchWholeWord = line[3] === "1" ? EverythingMatchOptions.WHOLEWORD : 0;
                const matchPath = line[4] === "1" ? EverythingMatchOptions.PATH : 0;
                const matchAccents = line[5] === "1" ? EverythingMatchOptions.ACCENTS : 0;

                filter[macro] = {
                    matchOptions: matchCase | matchWholeWord | matchPath | matchAccents,
                    name: line[1].replace(/\"/g, ""),
                    prefix: line[7].replace(/\"/g, ""),
                };
            }
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
}
