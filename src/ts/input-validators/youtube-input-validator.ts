import { InputValidator } from "./input-validator";

export class YoutubeInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string): boolean {
        const regex = /^y\!.*/;
        return regex.test(userInput);
    }
}
