import { StringHelpers } from "./helpers/string-helpers";
import { SearchResultItem } from "./search-result-item";
import { OnlineInputValidatorSearcherCombination } from "./online-input-validator-searcher-combination";

export class OnlineInputValidationService {
    private validatorSearcherCombinations: OnlineInputValidatorSearcherCombination[];

    public constructor(validatorSearcherCombinations: OnlineInputValidatorSearcherCombination[]) {
        this.validatorSearcherCombinations = validatorSearcherCombinations;
    }

    public getSearchResult(userInput: string): Array<Promise<SearchResultItem[]>> {
        const result = [] as Array<Promise<SearchResultItem[]>>;
        userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

        // if (StringHelpers.stringIsWhiteSpace(userInput)) {
        //     return result;
        // }

        for (const combination of this.validatorSearcherCombinations) {
            if (combination.validator.isValidForSearchResults(userInput)) {
                result.push(combination.searcher.getSearchResult(userInput));
            }
        }

        return result;
    }
}
