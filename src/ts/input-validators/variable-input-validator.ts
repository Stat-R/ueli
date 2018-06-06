import { InputValidator } from "./input-validator";

export class VariableInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string): boolean {
        const prefix = `$`;
        if (userInput.startsWith(prefix)) {
            return true;
        }

        return false;
    }
}
