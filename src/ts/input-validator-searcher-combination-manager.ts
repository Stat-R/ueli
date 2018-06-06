import { ConfigOptions } from "./config-options";
import { CountFileRepository } from "./count-file-repository";
import { CountManager } from "./count-manager";
import { defaultConfig } from "./default-config";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { Injector } from "./injector";
import { InputValidatorSearcherCombination } from "./input-validator-searcher-combination";
import { CalculatorInputValidator } from "./input-validators/calculator-input-validator";
import { CommandLineInputValidator } from "./input-validators/command-line-input-validator";
import { EmailAddressInputValidator } from "./input-validators/email-address-input-validator";
import { FilePathInputValidator } from "./input-validators/file-path-input-validator";
import { SearchPluginsInputValidator } from "./input-validators/search-plugins-input-validator";
import { VariableInputValidator } from "./input-validators/variable-input-validator";
import { WebSearchInputValidator } from "./input-validators/web-search-input-validator";
import { WebUrlInputValidator } from "./input-validators/web-url-input-validator";
import { CalculatorSearcher } from "./searcher/calculator-searcher";
import { CommandLineSearcher } from "./searcher/command-line-searcher";
import { EmailAddressSearcher } from "./searcher/email-address-searcher";
import { FilePathSearcher } from "./searcher/file-path-searcher";
import { SearchPluginsSearcher } from "./searcher/search-plugins-searcher";
import { VariableSearcher } from "./searcher/variable-searcher";
import { WebSearchSearcher } from "./searcher/web-search-searcher";
import { WebUrlSearcher } from "./searcher/web-url-searcher";
import { platform } from "os";

export class InputValidatorSearcherCombinationManager {
    private combinations: InputValidatorSearcherCombination[];

    constructor(config: ConfigOptions) {
        this.combinations = [
            {
                searcher: new CalculatorSearcher(),
                validator: new CalculatorInputValidator(),
            },
            {
                searcher: new VariableSearcher(config),
                validator: new VariableInputValidator(),
            },
            {
                searcher: new FilePathSearcher(config),
                validator: new FilePathInputValidator(),
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
                searcher: new EmailAddressSearcher(),
                validator: new EmailAddressInputValidator(),
            },
            {
                searcher: new WebUrlSearcher(),
                validator: new WebUrlInputValidator(),
            },
            {
                searcher: new SearchPluginsSearcher(config,
                    new CountManager(new CountFileRepository(UeliHelpers.countFilePath)),
                    Injector.getIconManager(platform())),
                validator: new SearchPluginsInputValidator(),
            },
        ];
    }

    public getCombinations(): InputValidatorSearcherCombination[] {
        return this.combinations;
    }
}
