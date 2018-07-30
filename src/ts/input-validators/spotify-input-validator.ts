import { InputValidator } from "./input-validator";

export class SpotifyInputValidator implements InputValidator {
    private prefix: string;
    private scope: string;

    constructor() {
        this.prefix = "s!";
        this.scope = "Spotify";
    }

    public isValidForSearchResults(userInput: string): boolean {
        return userInput.startsWith(this.prefix);
    }

    public getScopes(userInput: string): string[] {
        const scopes = [this.scope];
        let prefix = this.prefix;
        let trimmed = userInput.substr(this.prefix.length);
        const categoryPrefix = trimmed.match(/^(.+?)\!/);
        if (categoryPrefix){
            switch (categoryPrefix[1]) {
                case "playlist":
                case "album":
                case "artist":
                case "playlist":
                case "show":
                case "podcast":
                    prefix += categoryPrefix[0];
                    trimmed = trimmed.substr(categoryPrefix[0].length);
                    scopes.push(categoryPrefix[1].toUpperCase());
                    break;
            }
        }
        return [prefix, trimmed, ...scopes];
    }
}
