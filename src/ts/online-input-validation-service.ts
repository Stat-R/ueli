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
            if (combination.validator.isValidForSearchResults(userInput)) {
                result.push(combination.searcher.getSearchResult(userInput));
            }
        }

        return result;
    }

    public getScopes(userInput: string): string[] {
        for (const combination of this.combs) {
            if (combination.validator.isValidForSearchResults(userInput)) {
                if (combination.validator.getScopes) {
                    return combination.validator.getScopes(userInput);
                }
                break;
            }
        }
        return [];
    }

    public destruct() {
        this.combs.forEach((comb) => {
            comb.searcher.destruct && comb.searcher.destruct();
            comb.validator.destruct && comb.validator.destruct();
            comb.completer && comb.completer.destruct && comb.completer.destruct();
        })
    }
}
