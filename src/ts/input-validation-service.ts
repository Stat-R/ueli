import { StringHelpers } from "./helpers/string-helpers";
import { SearchResultItem } from "./search-result-item";
import { InputValidatorSearcherCombination } from "./input-validator-searcher-combination";
import { SearchEngine } from "./search-engine";
import { CountManager } from "./count-manager";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { CountFileRepository } from "./count-file-repository";

export class InputValidationService {
    private combs: InputValidatorSearcherCombination[];
    private searchEngine: SearchEngine;

    public constructor(combs: InputValidatorSearcherCombination[], sortThreshold: number) {
        this.combs = combs;
        const countManager = new CountManager(new CountFileRepository(UeliHelpers.countFilePath));
        this.searchEngine = new SearchEngine(sortThreshold, countManager);
    }

    public getSearchResult(userInput: string): Array<Promise<SearchResultItem[]>> {
        const result = [] as Array<Promise<SearchResultItem[]>>;
        userInput = StringHelpers.trimAndReplaceMultipleWhiteSpacesWithOne(userInput);

        if (StringHelpers.stringIsWhiteSpace(userInput)) {
            return result;
        }

        for (const combination of this.combs) {
            if (combination.validator.isValidForSearchResults(userInput)) {
                result.push(new Promise((resolve) => {
                    combination.searcher.getSearchResult(userInput)
                        .then((collection) => {
                            if (combination.searcher.needSort) {
                                collection = this.searchEngine.search(collection, userInput);
                            }
                            resolve(collection);
                        })
                        .catch(() => resolve([]));
                }));
            }
        }

        return result;
    }
}
