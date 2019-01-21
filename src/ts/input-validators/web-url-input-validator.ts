import { Injector } from "../injector";
import { InputValidator } from "./input-validator";

export class WebUrlInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string): boolean {
        return Injector.webUrlRegExp.test(userInput);
    }
}
