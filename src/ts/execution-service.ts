import { CountManager } from "./count-manager";
import { ExecutionArgumentValidatorExecutorCombination } from "./execution-argument-validator-executor-combination";
import { IpcChannels } from "./ipc-channels";
import { ipcMain } from "electron";

export class ExecutionService {
    private validatorExecutorCombinations: ExecutionArgumentValidatorExecutorCombination[];
    private countManager: CountManager;

    public constructor(validatorExecutorCombinations: ExecutionArgumentValidatorExecutorCombination[], countManager: CountManager) {
        this.validatorExecutorCombinations = validatorExecutorCombinations;

        if (countManager !== undefined) {
            this.countManager = countManager;
        }
    }

    public execute(executionArgument: string, alternative: boolean): void {
        for (const combi of this.validatorExecutorCombinations) {
            if (combi.validator.isValidForExecution(executionArgument)) {
                if (combi.executor.resetUserInputAfterExecution) {
                    ipcMain.emit(IpcChannels.resetUserInput);
                }

                if (combi.executor.logExecution) {
                    this.countManager.increaseCount(executionArgument);
                }

                setTimeout(() => {
                    combi.executor.execute(executionArgument, alternative);

                    if (combi.executor.hideAfterExecution) {
                        ipcMain.emit(IpcChannels.hideWindow, false);
                    }
                }, 50); // set delay for execution to 50ms otherwise user input reset does not work properly

                return;
            }
        }
    }

    public destruct() {
        this.validatorExecutorCombinations.forEach((comb) => {
            comb.validator.destruct && comb.validator.destruct();
            comb.executor.destruct && comb.executor.destruct();
        })
    }
}
