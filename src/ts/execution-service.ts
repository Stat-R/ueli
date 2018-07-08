import { ipcMain } from "electron";
import { ExecutionArgumentValidatorExecutorCombination } from "./execution-argument-validator-executor-combination";
import { IpcChannels } from "./ipc-channels";
import { CountManager } from "./count-manager";

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
                    if (combi.executor.hideAfterExecution) {
                        ipcMain.emit(IpcChannels.hideWindow, false);
                    }

                    combi.executor.execute(executionArgument, alternative);
                }, 50); // set delay for execution to 50ms otherwise user input reset does not work properly

                return;
            }
        }
    }
}
