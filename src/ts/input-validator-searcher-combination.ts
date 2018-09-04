import { ArgumentCompleter } from "./argument-completer";
import { InputValidator } from "./input-validators/input-validator";
import { Searcher } from "./searcher/searcher";

export class InputValidatorSearcherCombination {
    public completer?: ArgumentCompleter;
    public searcher: Searcher;
    public validator: InputValidator;
}
