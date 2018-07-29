import { ConfigOptions } from "./config-options";
import { Injector } from "./injector";
import { ProgramFileRepository } from "./programs-plugin/program-file-repository";
import { BrowserBookmark } from "./search-plugins/bookmark-plugin";
import { CustomCommandsPlugin } from "./search-plugins/custom-commands-plugin";
import { HomeFolderSearchPlugin } from "./search-plugins/home-folder-plugin";
import { ProgramsPlugin } from "./search-plugins/programs-plugin";
import { SearchPlugin } from "./search-plugins/search-plugin";
import { UeliCommandsSearchPlugin } from "./search-plugins/ueli-commands-plugin";
import { platform } from "os";

export class SearchPluginManager {
    private plugins: SearchPlugin[];

    public constructor(config: ConfigOptions) {
        this.plugins = [
            new HomeFolderSearchPlugin(),
            new UeliCommandsSearchPlugin(),
            new CustomCommandsPlugin(config.customCommands),
            new BrowserBookmark(config.bookmarkFromBrowser, config.bookmarkProfileName),
        ];

        config.applicationFolders.forEach((folder) => {
            this.plugins.push(new ProgramsPlugin(new ProgramFileRepository(folder, config.applicationFileExtensions)));
        });

        if (config.searchOperatingSystemSettings) {
            this.plugins.push(Injector.getOperatingSystemSettingsPlugin(platform()));
        }
    }

    public getPlugins(): SearchPlugin[] {
        return this.plugins;
    }
}
