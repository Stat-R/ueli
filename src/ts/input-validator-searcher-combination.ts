import { InputValidator } from "./input-validators/input-validator";
import { Searcher } from "./searcher/searcher";
import { SearchEngine } from "./search-engine";

export class InputValidatorSearcherCombination {
    public searcher: Searcher;
    public validator: InputValidator;
}
