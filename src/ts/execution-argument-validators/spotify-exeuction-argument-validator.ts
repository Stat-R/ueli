import { ExecutionArgumentValidator } from "./execution-argument-validator";

export class SpotifyExecutionArgumentValidator implements ExecutionArgumentValidator {
    public isValidForExecution(executionArgument: string): boolean {
        return executionArgument.startsWith("spotify:");
    }
}
