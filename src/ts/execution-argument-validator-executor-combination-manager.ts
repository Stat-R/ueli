import { ExecutionArgumentValidatorExecutorCombination } from "./execution-argument-validator-executor-combination";
import { FilePathExecutionArgumentValidator } from "./execution-argument-validators/file-path-execution-argument-validator";
import { WebSearchExecutionArgumentValidator } from "./execution-argument-validators/web-search-execution-argument-validator";
import { WebUrlExecutionArgumentValidator } from "./execution-argument-validators/web-url-execution-argument-validator";
import { CommandLineExecutor } from "./executors/command-line-executor";
import { CustomCommandExecutor } from "./executors/custom-command-executor";
import { FilePathExecutor } from "./executors/file-path-executor";
import { SpotifyExecutor } from "./executors/spotify-executor";
import { UeliCommandExecutor } from "./executors/ueli-command-executor";
import { WebSearchExecutor } from "./executors/web-search-executor";
import { WebUrlExecutor } from "./executors/web-url-executor";
import { ProcessExecutor } from "./executors/windows-executor";
import { WindowsSettingsExecutor } from "./executors/windows-settings-executor";
import { GlobalUELI } from "./global-ueli";
import { PrefixArgumentValidator } from "./execution-argument-validators/prefix-argument-validator";
import { ClipboardExecutor } from "./executors/clipboard-executor";
import { UeliHelpers } from "./helpers/ueli-helpers";
import { WindowsSettingsHelpers } from "./helpers/windows-settings-helpers";

export class ExecutionArgumentValidatorExecutorCombinationManager {
    private combinations: ExecutionArgumentValidatorExecutorCombination[];

    constructor(globalUELI: GlobalUELI) {
        this.combinations = [
            {
                executor: new FilePathExecutor(globalUELI.config.textEditor.path),
                validator: new FilePathExecutionArgumentValidator,
            },
            {
                executor: new WebUrlExecutor,
                validator: new WebUrlExecutionArgumentValidator,
            },
            {
                executor: new ProcessExecutor,
                validator: new PrefixArgumentValidator("HWND:"),
            },
            {
                executor: new ClipboardExecutor,
                validator: new PrefixArgumentValidator("clipboard:"),
            },
        ];

        if (globalUELI.config.features.ueliCommands) {
            this.combinations.push({
                executor: new UeliCommandExecutor,
                validator: new PrefixArgumentValidator(UeliHelpers.ueliCommandPrefix),
            });
        }

        if (globalUELI.config.features.webSearch) {
            this.combinations.push({
                executor: new WebSearchExecutor(globalUELI.config.webSearches),
                validator: new WebSearchExecutionArgumentValidator(globalUELI.config.webSearches),
            });
        }

        const clExecutor = new CommandLineExecutor(globalUELI.config.powerShellPath);

        if (globalUELI.config.features.commandLine) {
            this.combinations.push({
                executor: clExecutor,
                validator: new PrefixArgumentValidator(">"),
            });
        }

        if (globalUELI.config.features.customCommands) {
            this.combinations.push({
                executor: new CustomCommandExecutor(clExecutor),
                validator: new PrefixArgumentValidator(UeliHelpers.customCommandPrefix),
            });
        }

        if (globalUELI.config.features.spotify) {
            this.combinations.push({
                executor: new SpotifyExecutor(globalUELI.webSocketCommandSender),
                validator: new PrefixArgumentValidator("spotify:"),
            });
        }

        if (globalUELI.config.features.systemSettings) {
            this.combinations.push({
                executor: new WindowsSettingsExecutor,
                validator: new PrefixArgumentValidator(WindowsSettingsHelpers.windowsSettingsPrefix),
            });
        }

        for (const plugin of globalUELI.runPluginCollection) {
            if (plugin.executor && plugin.executionValidator) {
                this.combinations.push({
                    executor: new plugin.executor,
                    validator: new plugin.executionValidator,
                });
            }
        }

        for (const plugin of globalUELI.onlinePluginCollection) {
            if (plugin.executor && plugin.executionValidator) {
                this.combinations.push({
                    executor: new plugin.executor,
                    validator: new plugin.executionValidator,
                });
            }
        }
    }

    public getCombinations(): ExecutionArgumentValidatorExecutorCombination[] {
        return this.combinations;
    }
}
