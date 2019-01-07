import { ConfigOptions } from "./config-options";
import { Injector } from "./injector";
import { BrowserBookmark } from "./search-plugins/bookmark-plugin";
import { CustomCommandsPlugin } from "./search-plugins/custom-commands-plugin";
import { HomeFolderSearchPlugin } from "./search-plugins/home-folder-plugin";
import { ProgramsPlugin } from "./search-plugins/programs-plugin";
import { SearchPlugin } from "./search-plugins/search-plugin";
import { UeliCommandsSearchPlugin } from "./search-plugins/ueli-commands-plugin";

export class SearchPluginManager {
    private plugins: SearchPlugin[];

    public constructor(config: ConfigOptions) {
        this.plugins = [];

        if (config.features.homeFolder) {
            this.plugins.push(new HomeFolderSearchPlugin());
        }

        if (config.features.ueliCommands) {
            this.plugins.push(new UeliCommandsSearchPlugin());
        }

        if (config.features.customCommands) {
            this.plugins.push(new CustomCommandsPlugin(config.customCommands));
        }

        if (config.features.bookmark) {
            this.plugins.push(new BrowserBookmark(config.bookmarkFromBrowser, config.bookmarkProfileName));
        }

        if (config.features.programs) {
            this.plugins.push(new ProgramsPlugin(config));
        }

        if (config.features.systemSettings) {
            this.plugins.push(Injector.getOperatingSystemSettingsPlugin());
        }
    }

    public getPlugins(): SearchPlugin[] {
        return this.plugins;
    }
}
