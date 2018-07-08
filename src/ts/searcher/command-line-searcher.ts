import { SearchResultItem } from "../search-result-item";
import { Searcher } from "./searcher";
import { CommandLineHelpers } from "../helpers/command-line-helpers";
import { Icons } from "../icon-manager/icon-manager";

export class CommandLineSearcher implements Searcher {
    public readonly needSort = false;

    public async getSearchResult(userInput: string): Promise<SearchResultItem[]> {
        const command = userInput.replace(CommandLineHelpers.commandLinePrefix, "");

        return [
            {
                executionArgument: userInput,
                icon: Icons.COMMANDLINE,
                name: `Execute ${command}`,
                tags: [],
            } as SearchResultItem,
        ];
    }
}
