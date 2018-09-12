import { InputValidator } from "./input-validator";
import { SpotifySearcher } from "../searcher-online/spotify-searcher";

export class SpotifyInputValidator implements InputValidator {
    public isValidForSearchResults(userInput: string): boolean {
        return userInput.startsWith(SpotifySearcher.prefix);
    }

    public getScopes(userInput: string): string[] {
        const scopes = ["Spotify"];
        let prefix = SpotifySearcher.prefix;
        let trimmed = userInput.substr(SpotifySearcher.prefix.length);
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
