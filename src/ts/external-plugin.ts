import { ArgumentCompleter } from "./argument-completer";
import { ExecutionArgumentValidator } from "./execution-argument-validators/execution-argument-validator";
import { Executor } from "./executors/executor";
import { InputValidator } from "./input-validators/input-validator";
import { SearchEngine } from "./search-engine";
import { Searcher } from "./searcher/searcher";

// tslint:disable:max-classes-per-file

class ExternalPluginSearcher implements Searcher {
    public needSort?: boolean;
    public shouldIsolate?: boolean;
    public getSearchResult: Searcher["getSearchResult"];
    public fuzzySearcher?: SearchEngine["search"];
    public destruct?: () => void;
}

class ExternalPluginInputValidator implements InputValidator {
    public isValidForSearchResults: InputValidator["isValidForSearchResults"];
    public getScopes: InputValidator["getScopes"];
    public destruct?: () => void;
}

class ExternalPluginExecutionArgumentValidator implements ExecutionArgumentValidator {
    public isValidForExecution: ExecutionArgumentValidator["isValidForExecution"];
    public destruct?: () => void;
}

class ExternalPluginExecutor implements Executor {
    public hideAfterExecution: boolean;
    public resetUserInputAfterExecution: boolean;
    public logExecution: boolean;
    public execute: Executor["execute"];
    public destruct?: () => void;
}

class ExternalPluginCompleter implements ArgumentCompleter {
    public isCompletable: ArgumentCompleter["isCompletable"];
    public complete: ArgumentCompleter["complete"];
    public destruct?: () => void;
}

interface ExternalPlugin {
    inputValidator: typeof ExternalPluginInputValidator;
    executionValidator: typeof ExternalPluginExecutionArgumentValidator;
    executor: typeof ExternalPluginExecutor;
    completer?: typeof ExternalPluginCompleter;
}

export interface ExternalRunPlugin extends ExternalPlugin {
    runSearcher: typeof ExternalPluginSearcher;
}

export interface ExternalOnlinePlugin extends ExternalPlugin {
    onlineSearcher: typeof ExternalPluginSearcher;
}
