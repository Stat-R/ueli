import { SearchResultItem } from "../search-result-item";
import { SearchPlugin } from "./search-plugin";
import { IpcChannels } from "../ipc-channels";
import { UeliHelpers } from "../helpers/ueli-helpers";
import { Icons } from "../icon-manager/icon-manager";

export class UeliCommandsSearchPlugin implements SearchPlugin {
    private items: UeliCommand[];

    public constructor() {
        this.items = [
            {
                executionArgument: IpcChannels.ueliReload,
                name: "Reload ueli",
            },
            {
                executionArgument: IpcChannels.ueliExit,
                name: "Exit ueli",
            },
            {
                executionArgument: UeliHelpers.configFilePath,
                name: "Edit configuration file",
            },
            {
                executionArgument: IpcChannels.ueliRescan,
                name: "Rescan plugins",
            },
        ];
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        return this.items.map((i): SearchResultItem => ({
            executionArgument: i.executionArgument,
            icon: Icons.UELI,
            name: i.name,
        } as SearchResultItem));
    }
}
