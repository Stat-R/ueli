import { InputValidator } from "./input-validator";
import { FilePathRegex } from "../helpers/file-path-regex";

export class FilePathInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string, cwd: string | undefined): boolean {
        const regex = FilePathRegex.windowsFilePathRegExp;
        const isValidPath = regex.test(userInput);

        if (!isValidPath && cwd) {
            userInput = `${cwd}${userInput}`;
            return regex.test(userInput);
        }

        return isValidPath;
    }
}
