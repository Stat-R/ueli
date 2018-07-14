import { SearchPlugin } from "./search-plugin";
import { SearchResultItem } from "../search-result-item";
import { CustomCommand } from "../custom-command";
import { UeliHelpers } from "../helpers/ueli-helpers";
import { Icons } from "../icon-manager/icon-manager";

export class CustomCommandsPlugin implements SearchPlugin {
    private customCommands: CustomCommand[];

    constructor(customCommands: CustomCommand[]) {
        this.customCommands = customCommands;
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        return this.convertToSearchResultItems(this.customCommands);
    }

    private convertToSearchResultItems(customCommands: CustomCommand[]): SearchResultItem[] {
        const result = [] as SearchResultItem[];

        for (const customCommand of customCommands) {
            result.push({
                executionArgument: `${UeliHelpers.customCommandPrefix}${customCommand.executionArgument}`,
                icon: customCommand.icon || Icons.CUSTOMSHORTCUT,
                name: customCommand.name,
            });
        }

        return result;
    }
}
