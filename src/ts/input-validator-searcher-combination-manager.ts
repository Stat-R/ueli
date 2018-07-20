import { ConfigOptions } from "./config-options";
import { InputValidatorSearcherCombination } from "./input-validator-searcher-combination";
import { CalculatorInputValidator } from "./input-validators/calculator-input-validator";
import { CommandLineInputValidator } from "./input-validators/command-line-input-validator";
import { FilePathInputValidator } from "./input-validators/file-path-input-validator";
import { PrefixInputValidator } from "./input-validators/prefix-input-validator";
import { SearchPluginsInputValidator } from "./input-validators/search-plugins-input-validator";
import { WebSearchInputValidator } from "./input-validators/web-search-input-validator";
import { WebUrlInputValidator } from "./input-validators/web-url-input-validator";
import { CalculatorSearcher } from "./searcher/calculator-searcher";
import { CommandLineSearcher } from "./searcher/command-line-searcher";
import { FilePathSearcher } from "./searcher/file-path-searcher";
import { SearchPluginsSearcher } from "./searcher/search-plugins-searcher";
import { VariableSearcher } from "./searcher/variable-searcher";
import { WebSearchSearcher } from "./searcher/web-search-searcher";
import { WebUrlSearcher } from "./searcher/web-url-searcher";

export class InputValidatorSearcherCombinationManager {
    private combinations: InputValidatorSearcherCombination[];

    constructor(config: ConfigOptions) {
        this.combinations = [
            {
                searcher: new CalculatorSearcher(),
                validator: new CalculatorInputValidator(),
            },
            {
                searcher: new VariableSearcher(),
                validator: new PrefixInputValidator("$"),
            },
            {
                searcher: new CommandLineSearcher(),
                validator: new CommandLineInputValidator(),
            },
            {
                searcher: new WebSearchSearcher(config.webSearches),
                validator: new WebSearchInputValidator(config.webSearches),
            },
            {
                searcher: new FilePathSearcher(config.searchEngineThreshold, config.applicationFileExtensions, config.textEditor.name),
                validator: new FilePathInputValidator(),
            },
            {
                searcher: new WebUrlSearcher(),
                validator: new WebUrlInputValidator(),
            },
            {
                searcher: new SearchPluginsSearcher(config),
                validator: new SearchPluginsInputValidator(),
            },
        ];
    }

    public getCombinations(): InputValidatorSearcherCombination[] {
        return this.combinations;
    }
}
