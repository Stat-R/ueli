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

    public execute(executionArgument: string, alternative: boolean, cwd: string | undefined): void {
        for (const combi of this.validatorExecutorCombinations) {
            if (combi.validator.isValidForExecution(executionArgument)) {
                combi.executor.execute(executionArgument, alternative, cwd);

                if (combi.executor.resetUserInputAfterExecution) {
                    ipcMain.emit(IpcChannels.resetUserInput);
                }

                if (combi.executor.hideAfterExecution) {
                    ipcMain.emit(IpcChannels.hideWindow, false);
                }

                if (combi.executor.logExecution) {
                    this.countManager.increaseCount(executionArgument);
                }

                return;
            }
        }
    }

    public destruct() {
        this.validatorExecutorCombinations.forEach((comb) => {
            if (comb.validator.destruct) {
                comb.validator.destruct();
            }

            if (comb.executor.destruct) {
                comb.executor.destruct();
            }
        });
    }
}
