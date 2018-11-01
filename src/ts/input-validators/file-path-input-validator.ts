import { Injector } from "../injector";
import { InputValidator } from "./input-validator";
import { platform } from "os";

export class FilePathInputValidator implements InputValidator {
    private regex = Injector.getFilePathRegExp(platform());

    public isValidForSearchResults(userInput: string, cwd: string | undefined): boolean {
        const isValidPath = this.regex.test(userInput);

        if (!isValidPath && cwd) {
            userInput = `${cwd}${userInput}`;
            return this.regex.test(userInput);
        }

        return isValidPath;
    }
}
