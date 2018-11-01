import { CountFileRepository } from "./count-file-repository";
import { CountManager } from "./count-manager";
import { StringHelpers } from "./helpers/string-helpers";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { InputValidatorSearcherCombination } from "./input-validator-searcher-combination";
import { SearchEngine } from "./search-engine";
import { SearchResultItem } from "./search-result-item";

export class InputValidationService {
    private combs: InputValidatorSearcherCombination[];
    private searchEngine: SearchEngine;

    public constructor(combs: InputValidatorSearcherCombination[]) {
        this.combs = combs;
        const countManager = new CountManager(new CountFileRepository(UeliHelpers.countFilePath));
        this.searchEngine = new SearchEngine(countManager);

        // Exposes search engine's search method for external plugin
        this.combs.forEach((comb) => {
            if (comb.searcher.fuzzySearcher) {
                comb.searcher.fuzzySearcher = this.searchEngine.search;
            }
        });
    }

    public async getSearchResult(userInput: string, cwd: string | undefined): Promise<SearchResultItem[]> {
        let genericResult = [] as SearchResultItem[];
        const uniqueResult = [] as SearchResultItem[];
        userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

        if (StringHelpers.stringIsWhiteSpace(userInput)) {
            return genericResult;
        }

        for (const combination of this.combs) {
            if (combination.validator.isValidForSearchResults(userInput, cwd)) {
                const getResults = await combination.searcher.getSearchResult(userInput, cwd);
                if (combination.searcher.shouldIsolate) {
                    if (combination.searcher.needSort) {
                        return this.searchEngine.search(getResults, userInput);
                    }

                    return getResults;
                }

                if (combination.searcher.needSort) {
                    genericResult.push(...getResults);
                } else {
                    uniqueResult.push(...getResults);
                }
            }
        }

        genericResult = this.searchEngine.search(genericResult, userInput);

        return uniqueResult.concat(genericResult);
    }

    public getScopes(userInput: string): string[] {
        for (const combination of this.combs) {
            if (combination.validator.isValidForSearchResults(userInput, undefined)
             && combination.validator.getScopes) {
                const scopes = combination.validator.getScopes(userInput);
                if (scopes.length > 0) {
                    return scopes;
                }
            }
        }
        return [];
    }

    public complete(userInput: string, cavetPosition: number, selectingResult?: SearchResultItem): string[] {
        for (const combination of this.combs) {
            if (combination.completer
             && combination.completer.isCompletable(userInput, cavetPosition, selectingResult)) {
                return combination.completer.complete(userInput, cavetPosition, selectingResult);
            }
        }
        return [];
    }

    public destruct() {
        this.combs.forEach((comb) => {
            if (comb.searcher.destruct) {
                comb.searcher.destruct();
            }
            if (comb.validator.destruct) {
                comb.validator.destruct();
            }
            if (comb.completer && comb.completer.destruct) {
                comb.completer.destruct();
            }
        });
    }
}
