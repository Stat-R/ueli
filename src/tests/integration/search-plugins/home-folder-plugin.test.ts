import { HomeFolderSearchPlugin } from "../../../ts/search-plugins/home-folder-plugin";

describe(HomeFolderSearchPlugin.name, (): void => {
    const plugin = new HomeFolderSearchPlugin();

    describe(plugin.getAllItems.name, (): void => {
        it("should return more than zero search result items", (): void => {
            plugin.getAllItems()
                .then((actual) => {
                    expect(actual.length).toBeGreaterThan(0);
                });
        });

        it("all returned items should have name, execution argument and tags set", (): void => {
            plugin.getAllItems()
                .then((actual) => {
                    for (const item of actual) {
                        expect(item.name.length).toBeGreaterThan(0);
                        expect(item.executionArgument.length).toBeGreaterThan(0);
                        expect(item.tags).not.toBeUndefined();
                        expect(item.tags.length).toBe(0);
                    }
                });
        });
    });
});
