import { ConfigOptions } from "./config-options";
import { BrowserBookmark } from "./search-plugins/bookmark-plugin";
import { CustomCommandsPlugin } from "./search-plugins/custom-commands-plugin";
import { HomeFolderSearchPlugin } from "./search-plugins/home-folder-plugin";
import { ProgramsPlugin } from "./search-plugins/programs-plugin";
import { SearchPlugin } from "./search-plugins/search-plugin";
import { UeliCommandsSearchPlugin } from "./search-plugins/ueli-commands-plugin";
import { NativeUtil } from "./native-lib";
import { SearchResultItem } from "./search-result-item";
import { Windows10SettingsSearchPlugin } from "./search-plugins/windows-10-settings-plugin";

export class SearchPluginManager {
    private plugins: SearchPlugin[];

    constructor(config: ConfigOptions, nativeUtil: NativeUtil) {
        this.plugins = [];

        if (config.features.homeFolder) {
            this.plugins.push(new HomeFolderSearchPlugin(nativeUtil));
        }

        if (config.features.ueliCommands) {
            this.plugins.push(new UeliCommandsSearchPlugin());
        }

        if (config.features.customCommands) {
            this.plugins.push(new CustomCommandsPlugin(config.customCommands));
        }

        if (config.features.bookmark) {
            this.plugins.push(new BrowserBookmark(
                config.bookmarkFromBrowser,
                config.bookmarkProfileName,
            ));
        }

        if (config.features.programs) {
            this.plugins.push(new ProgramsPlugin(config, nativeUtil));
        }

        if (config.features.systemSettings) {
            this.plugins.push(new Windows10SettingsSearchPlugin());
        }
    }

    public getPlugins(): Array<Promise<SearchResultItem[]>> {
        return this.plugins.map((p) => p.getAllItems());
    }
}
