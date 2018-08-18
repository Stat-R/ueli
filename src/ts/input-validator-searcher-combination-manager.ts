import { GlobalUELI } from "./global-ueli";
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

    constructor(globalUELI: GlobalUELI) {
        this.combinations = [
            {
                searcher: new CalculatorSearcher(),
                validator: new CalculatorInputValidator(),
            },
            {
                searcher: new VariableSearcher(),
                validator: new PrefixInputValidator("$", "Variable"),
            },
            {
                searcher: new CommandLineSearcher(globalUELI.config.powerShellPath),
                validator: new CommandLineInputValidator(),
            },
            {
                searcher: new WebSearchSearcher(globalUELI.config.webSearches),
                validator: new WebSearchInputValidator(globalUELI.config.webSearches),
            },
            {
                searcher: new FilePathSearcher(globalUELI.config.applicationFileExtensions, globalUELI.config.textEditor.name),
                validator: new FilePathInputValidator(),
            },
            {
                searcher: new WebUrlSearcher(),
                validator: new WebUrlInputValidator(),
            },
            {
                searcher: new SearchPluginsSearcher(globalUELI.config),
                validator: new SearchPluginsInputValidator(),
            },
        ];

        for (const plugin of globalUELI.runPluginCollection) {
            this.combinations.push({
                searcher: new plugin.runSearcher(),
                validator: new plugin.inputValidator(),
            });
        }
    }

    public getCombinations(): InputValidatorSearcherCombination[] {
        return this.combinations;
    }
}
