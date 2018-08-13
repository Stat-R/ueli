import { ExecutionArgumentValidatorExecutorCombination } from "./execution-argument-validator-executor-combination";
import { CommandLineExecutionArgumentValidator } from "./execution-argument-validators/command-line-execution-argument-validator";
import { CustomCommandExecutionArgumentValidator } from "./execution-argument-validators/custom-command-exeuction-argument-validator";
import { FilePathExecutionArgumentValidator } from "./execution-argument-validators/file-path-execution-argument-validator";
import { MacOsSettingsExecutionArgumentValidator } from "./execution-argument-validators/mac-os-execution-argument-validator";
import { SpotifyExecutionArgumentValidator } from "./execution-argument-validators/spotify-exeuction-argument-validator";
import { UeliCommandExecutionArgumentValidator } from "./execution-argument-validators/ueli-command-execution-argument-validator";
import { WebSearchExecutionArgumentValidator } from "./execution-argument-validators/web-search-execution-argument-validator";
import { WebUrlExecutionArgumentValidator } from "./execution-argument-validators/web-url-execution-argument-validator";
import { ProcessExecutionArgumentValidator } from "./execution-argument-validators/windows-execution-argument-validator";
import { WindowsSettingsExecutionArgumentValidator } from "./execution-argument-validators/windows-settings-execution-argument-validator";
import { CommandLineExecutor } from "./executors/command-line-executor";
import { CustomCommandExecutor } from "./executors/custom-command-executor";
import { FilePathExecutor } from "./executors/file-path-executor";
import { MacOsSettingsExecutor } from "./executors/mac-os-settings-executor";
import { SpotifyExecutor } from "./executors/spotify-executor";
import { UeliCommandExecutor } from "./executors/ueli-command-executor";
import { WebSearchExecutor } from "./executors/web-search-executor";
import { WebUrlExecutor } from "./executors/web-url-executor";
import { ProcessExecutor } from "./executors/windows-executor";
import { WindowsSettingsExecutor } from "./executors/windows-settings-executor";
import { OperatingSystemHelpers } from "./helpers/operating-system-helpers";
import { GlobalUELI } from "./main";
import { OperatingSystem } from "./operating-system";
import { platform } from "os";

export class ExecutionArgumentValidatorExecutorCombinationManager {
    private combinations: ExecutionArgumentValidatorExecutorCombination[];

    constructor(globalUELI: GlobalUELI) {
        const clExecutor = new CommandLineExecutor(globalUELI.config.powerShellPath);
        this.combinations = [
            {
                executor: new UeliCommandExecutor(),
                validator: new UeliCommandExecutionArgumentValidator(),
            },
            {
                executor: new FilePathExecutor(globalUELI.config.textEditor.path),
                validator: new FilePathExecutionArgumentValidator(),
            },
            {
                executor: clExecutor,
                validator: new CommandLineExecutionArgumentValidator(),
            },
            {
                executor: new WebSearchExecutor(globalUELI.config.webSearches),
                validator: new WebSearchExecutionArgumentValidator(globalUELI.config.webSearches),
            },
            {
                executor: new WebUrlExecutor(),
                validator: new WebUrlExecutionArgumentValidator(),
            },
            {
                executor: new CustomCommandExecutor(clExecutor),
                validator: new CustomCommandExecutionArgumentValidator(),
            },
            {
                executor: new SpotifyExecutor(globalUELI.webSocketCommandSender),
                validator: new SpotifyExecutionArgumentValidator(),
            },
            {
                executor: new ProcessExecutor(),
                validator: new ProcessExecutionArgumentValidator(),
            },
        ];

        switch (OperatingSystemHelpers.getOperatingSystemFromString(platform())) {
            case OperatingSystem.Windows: {
                this.combinations.push({
                    executor: new WindowsSettingsExecutor(),
                    validator: new WindowsSettingsExecutionArgumentValidator(),
                });
                break;
            }
            case OperatingSystem.macOS: {
                this.combinations.push({
                    executor: new MacOsSettingsExecutor(),
                    validator: new MacOsSettingsExecutionArgumentValidator(),
                });
                break;
            }
        }

        for (const plugin of globalUELI.runPluginCollection) {
            if (plugin.executor && plugin.executionValidator) {
                this.combinations.push({
                    executor: new plugin.executor(),
                    validator: new plugin.executionValidator(),
                });
            }
        }

        for (const plugin of globalUELI.onlinePluginCollection) {
            if (plugin.executor && plugin.executionValidator) {
                this.combinations.push({
                    executor: new plugin.executor(),
                    validator: new plugin.executionValidator(),
                });
            }
        }
    }

    public getCombinations(): ExecutionArgumentValidatorExecutorCombination[] {
        return this.combinations;
    }
}
