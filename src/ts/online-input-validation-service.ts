import { StringHelpers } from "./helpers/string-helpers";
import { InputValidatorSearcherCombination } from "./input-validator-searcher-combination";
import { SearchEngine } from "./search-engine";
import { SearchResultItem } from "./search-result-item";

export class OnlineInputValidationService {
    private combs: InputValidatorSearcherCombination[];
    private searchEngine: SearchEngine;

    public constructor(validatorSearcherCombinations: InputValidatorSearcherCombination[]) {
        this.combs = validatorSearcherCombinations;
        this.searchEngine = new SearchEngine();

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
            if (combination.validator.isValidForSearchResults(userInput, undefined)) {
                result.push(combination.searcher.getSearchResult(userInput, undefined));
            }
        }

        return result;
    }

    public getScopes(userInput: string): string[] {
        for (const combination of this.combs) {
            if (combination.validator.isValidForSearchResults(userInput, undefined)) {
                if (combination.validator.getScopes) {
                    return combination.validator.getScopes(userInput);
                }
                break;
            }
        }
        return [];
    }

    public complete(userInput: string, cavetPosition: number, selectingResult: SearchResultItem): string[] {
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
