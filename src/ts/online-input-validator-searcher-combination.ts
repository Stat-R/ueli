import { InputValidator } from "./input-validators/input-validator";
import { SearcherOnline } from "./searcher-online/searcher";

export class OnlineInputValidatorSearcherCombination {
    public searcher: SearcherOnline;
    public validator: InputValidator;
}
