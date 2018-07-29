import { InputValidator } from "./input-validator";

export class PrefixInputValidator implements InputValidator {
    private prefix: string;
    private scope: string;

    constructor(prefix: string, scope: string) {
        this.prefix = prefix;
        this.scope = scope;
    }

    public isValidForSearchResults(userInput: string): boolean {
        return userInput.startsWith(this.prefix);
    }

    public getScopes(userInput: string): string[] {
        const trimmed = userInput.substr(this.prefix.length);
        return [this.prefix, trimmed, this.scope];
    }
}
