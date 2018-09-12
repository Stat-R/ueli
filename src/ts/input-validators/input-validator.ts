export interface InputValidator {
    isValidForSearchResults(userInput: string): boolean;
    getScopes?: (userInput: string) => string[];
    destruct?: () => void;
}
