import { InputValidator } from "./input-validator";

export class SpotifyInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string): boolean {
        const regex = /^s\!.*/;
        return regex.test(userInput);
    }
}
