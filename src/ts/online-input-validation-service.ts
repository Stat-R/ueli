import { StringHelpers } from "./helpers/string-helpers";
import { OnlineInputValidatorSearcherCombination } from "./online-input-validator-searcher-combination";
import { SearchResultItem } from "./search-result-item";

export class OnlineInputValidationService {
    private combs: OnlineInputValidatorSearcherCombination[];

    public constructor(validatorSearcherCombinations: OnlineInputValidatorSearcherCombination[]) {
        this.combs = validatorSearcherCombinations;
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
            if (combination.validator.isValidForSearchResults(userInput)
             && combination.validator.getScopes) {
                return combination.validator.getScopes(userInput);
            }
        }
        return [];
    }
}
