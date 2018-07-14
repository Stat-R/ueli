import { StringHelpers } from "./helpers/string-helpers";
import { SearchResultItem } from "./search-result-item";
import { Icons } from "./icon-manager/icon-manager";
import { NativeUtil } from "../../native-util/native-util";
import { readFileSync } from "fs";

interface EverythingFilter {
    [key: string]: {
        prefix: string;
        matchOptions: number;
    }
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

    constructor(nativeUtil: NativeUtil, maxResults: number, filterFile: string) {
        this.nativeUtil = nativeUtil;
        this.maxResults = maxResults;

        if (filterFile) {
            this.filters = this.parseFilterCSV(filterFile);
        }
    }

    public getSearchResult(userInput: string): Promise<SearchResultItem[]> {
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

            let matchPrefix = userInput.match(/^(.+?)\!/);
            if (matchPrefix) {
                const prefix = matchPrefix[1];
                let char = 0;
                while (prefix[char] !== undefined) {
                    switch(prefix[char]) {
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
                    char++;
                }
                userInput = userInput.replace(/^(.+?)\!/, "");
            }

            let matchOptions = 0;

            let filterPrefix = userInput.match(/^(.+?)\:/);
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

            this.nativeUtil.queryEverything(userInput, this.maxResults, matchOptions);
            const interval = setInterval(() => {
                const rawList = this.nativeUtil.resolveEverything();

                if (rawList.length === 0) {
                    return;
                }

                const results: SearchResultItem[] = [];
                for (let i = 0; i < rawList.length; i++) {
                    results.push({
                        executionArgument: rawList[i][1],
                        icon: rawList[i][2] === "folder" ? Icons.FOLDER : Icons.FILE,
                        name: rawList[i][0],
                    });
                }

                resolve(results);

                clearInterval(interval);
            }, 50)
        });
    }

    private parseFilterCSV(filePath: string): EverythingFilter | undefined {
        let filter: EverythingFilter = {};
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
                    prefix: line[7].replace(/\"/g, ""),
                    matchOptions: matchCase | matchWholeWord | matchPath | matchAccents,
                }
            }
        }

        return filter;
    }

    private mergeOptions(current: number, condition: boolean | null, value: number): number {
        if (condition !== null) {
            if (condition) {
                return (current | value)
            } else if (current & value) {
                return (current - value);
            }
        }
        return current;
    }
}
