import { Searcher } from "./searcher";
import { ConfigOptions } from "../config-options";
import { SearchPluginManager } from "../search-plugin-manager";
import { SearchResultItem } from "../search-result-item";
import { NativeUtil } from "../native-lib";

export class SearchPluginsSearcher implements Searcher {
    public readonly needSort = true;
    public readonly shouldIsolate = false;

    private items: SearchResultItem[];
    private config: ConfigOptions;
    private nativeUtil: NativeUtil;

    constructor(config: ConfigOptions, nativeUtil: NativeUtil) {
        this.config = config;
        this.items = [];
        this.nativeUtil = nativeUtil;
        this.loadSearchPluginItems();
    }

    public async getSearchResult(): Promise<SearchResultItem[]> {
        return this.items;
    }

    private async loadSearchPluginItems(): Promise<void> {
        this.items.length = 0;

        new SearchPluginManager(this.config, this.nativeUtil)
            .getPlugins()
            .forEach((plugin) => {
                plugin.then((result) => this.items = this.items.concat(result));
            });
    }
}
