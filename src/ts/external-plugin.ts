import { ArgumentCompleter } from "./argument-completer";
import { ExecutionArgumentValidator } from "./execution-argument-validators/execution-argument-validator";
import { Executor } from "./executors/executor";
import { InputValidator } from "./input-validators/input-validator";
import { SearchEngine } from "./search-engine";
import { Searcher } from "./searcher/searcher";

class ExternalPluginSearcher implements Searcher {
    needSort?: boolean;
    shouldIsolate?: boolean;
    getSearchResult: Searcher["getSearchResult"];
    fuzzySearcher?: SearchEngine["search"];
    destruct?: () => void;
}

class ExternalPluginInputValidator implements InputValidator {
    isValidForSearchResults: InputValidator["isValidForSearchResults"];
    getScopes: InputValidator["getScopes"];
    destruct?: () => void;
}

class ExternalPluginExecutionArgumentValidator implements ExecutionArgumentValidator {
    isValidForExecution: ExecutionArgumentValidator["isValidForExecution"];
    destruct?: () => void;
}

class ExternalPluginExecutor implements Executor {
    hideAfterExecution: boolean;
    resetUserInputAfterExecution: boolean;
    logExecution: boolean;
    execute: Executor["execute"];
    destruct?: () => void;
}

class ExternalPluginCompleter implements ArgumentCompleter {
    isCompletable: ArgumentCompleter["isCompletable"];
    complete: ArgumentCompleter["complete"];
    destruct?: () => void;
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