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

    public getSearchResult(userInput: string): Array<Promise<SearchResultItem[]>> {
        const result = [] as Array<Promise<SearchResultItem[]>>;
        userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

        if (StringHelpers.stringIsWhiteSpace(userInput)) {
            return result;
        }

        for (const combination of this.combs) {
            if (combination.validator.isValidForSearchResults(userInput)) {
                const getResults = new Promise<SearchResultItem[]>((resolve) => {
                    combination.searcher.getSearchResult(userInput)
                        .then((collection) => {
                            if (combination.searcher.needSort) {
                                collection = this.searchEngine.search(collection, userInput);
                            }
                            resolve(collection);
                        })
                        .catch(() => resolve([]));
                });

                if (combination.searcher.shouldIsolate) {
                    result.length = 0;
                    result.push(getResults);
                    break;
                } else {
                    result.push(getResults);
                }
            }
        }

        return result;
    }

    public getScopes(userInput: string): string[] {
        for (const combination of this.combs) {
            if (combination.validator.isValidForSearchResults(userInput)
             && combination.validator.getScopes) {
                const scopes = combination.validator.getScopes(userInput);
                if (scopes.length > 0) {
                    return scopes;
                }
            }
        }
        return [];
    }

    public complete(userInput: string, cavetPosition: number, selectingResult: SearchResultItem): string {
        for (const combination of this.combs) {
            if (combination.completer
             && combination.completer.isCompletable(userInput, cavetPosition, selectingResult)) {
                return combination.completer.complete(userInput, cavetPosition, selectingResult);
            }
        }
        return "";
    }

    public destruct() {
        this.combs.forEach((comb) => {
            comb.searcher.destruct && comb.searcher.destruct();
            comb.validator.destruct && comb.validator.destruct();
            comb.completer && comb.completer.destruct && comb.completer.destruct();
        })
    }
}
