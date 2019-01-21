import { SearchPlugin } from "./search-plugin";
import { SearchResultItem } from "../search-result-item";
import * as os from "os";
import { NativeUtil } from "../native-lib";
import { Icons } from "../icon-manager/icon-manager";
import { FileHelpers } from "../helpers/file-helpers";

export class HomeFolderSearchPlugin implements SearchPlugin {
    private homeFolderPath = os.homedir();
    private nativeUtil: NativeUtil;

    constructor(nativeUtil: NativeUtil) {
        this.nativeUtil = nativeUtil;
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        return this.nativeUtil.iterateFolder(this.homeFolderPath)
            .map((file) => ({
                breadCrumb: FileHelpers.crumbsToLinkedCrumbs(file.crumbs()),
                executionArgument: file.path(),
                icon: file.isDir() ? Icons.FOLDER : Icons.FILE,
                name: file.name(),
            }) as SearchResultItem);
    }
}
