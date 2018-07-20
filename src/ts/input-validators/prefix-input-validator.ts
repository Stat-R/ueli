import { InputValidator } from "./input-validator";

export class PrefixInputValidator implements InputValidator {
    private prefix: string;
    constructor(prefix: string) {
        this.prefix = prefix;
    }
    public isValidForSearchResults(userInput: string): boolean {
        return userInput.startsWith(this.prefix);
    }
}
