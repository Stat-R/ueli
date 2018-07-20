import { Searcher } from "./searcher";
import { ConfigOptions } from "../config-options";
import { SearchPluginManager } from "../search-plugin-manager";
import { SearchResultItem } from "../search-result-item";

export class SearchPluginsSearcher implements Searcher {
    public readonly needSort = true;
    public readonly shouldIsolate = false;

    private items: SearchResultItem[];
    private config: ConfigOptions;

    constructor(config: ConfigOptions) {
        this.config = config;
        this.items = [];
        this.rescanAllPlugin();
    }

    public rescanAllPlugin() {
        this.items.length = 0;
        this.loadSearchPluginItems(this.config);
    }

    public async getSearchResult(): Promise<SearchResultItem[]> {
        return this.items;
    }

    private loadSearchPluginItems(config: ConfigOptions): void {
        const allPlugins = new SearchPluginManager(config).getPlugins();
        allPlugins.forEach((plugin) => plugin.getAllItems()
                .then((results) => this.items.push(...results)));
    }
}
