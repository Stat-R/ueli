import { InputValidator } from "./input-validator";
import { CommandLineHelpers } from "../helpers/command-line-helpers";

export class CommandLineInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string): boolean {
        return this.userInputStartsWithPrefix(userInput)
            && this.prefixIsFollowedByCommand(userInput);
    }

    public getScopes(userInput: string): string[] {
        const trimmed = userInput.substr(CommandLineHelpers.commandLinePrefix.length);
        return [CommandLineHelpers.commandLinePrefix, trimmed, "CLI"];
    }

    private userInputStartsWithPrefix(userInput: string): boolean {
        return userInput.startsWith(CommandLineHelpers.commandLinePrefix);
    }

    private prefixIsFollowedByCommand(userInput: string): boolean {
        return userInput[1] !== " ";
    }
}
