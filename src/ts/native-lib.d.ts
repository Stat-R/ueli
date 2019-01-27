import { Buffer } from "nbind/dist/shim";

export class NBindBase { free?(): void }

export class EverythingResult extends NBindBase {
	/** std::string name; -- Read-only */
	name: string;

	/** std::string path; -- Read-only */
	path: string;

	/** bool isDir; -- Read-only */
	isDir: boolean;
}

export class File extends NBindBase {
	/** std::string path(); */
	path(): string;

	/** std::string name(); */
	name(): string;

	/** bool isDir(); */
	isDir(): boolean;

	/** std::vector<std::string> crumbs(); */
	crumbs(): string[];
}

export class NativeUtil extends NBindBase {
	/** NativeUtil(); */
	constructor();

	/** void storeBrowserHwnd(); */
	storeBrowserHwnd(): void;

	/** void elevateExecute(std::string); */
	elevateExecute(p0: string): void;

	/** void queryEverything(std::string, int32_t, int32_t, cbFunction &); */
	queryEverything(p0: string, p1: number, p2: number, p3: (...args: any[]) => any): void;

	/** void activateContextMenu(std::string); */
	activateContextMenu(p0: string): void;

	/** void takeScreenshot(int32_t, int32_t, std::string); */
	takeScreenshot(p0: number, p1: number, p2: string): void;

	/** std::string getExplorerPath(); */
	getExplorerPath(): string;

	/** void storeLastFgWindow(); */
	storeLastFgWindow(): void;

	/** std::vector<File> iterateFolder(std::string); */
	iterateFolder(p0: string): File[];

	/** std::vector<File> recursiveIterateFolder(std::string); */
	recursiveIterateFolder(p0: string): File[];
}
