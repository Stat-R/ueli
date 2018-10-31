import { Injector } from "../injector";
import { InputValidator } from "./input-validator";
import { platform } from "os";

export class FilePathInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string, cwd: string | undefined): boolean {
        if (cwd) {
            userInput = `${cwd}${userInput}`;
        }

        const regex = Injector.getFilePathRegExp(platform());
        return regex.test(userInput);
    }
}
