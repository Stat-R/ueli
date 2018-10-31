export interface InputValidator {
    getScopes?: (userInput: string) => string[];
    destruct?: () => void;
    isValidForSearchResults(userInput: string, cwd: string | undefined): boolean;
}
