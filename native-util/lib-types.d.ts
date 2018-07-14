import { Buffer } from "nbind/dist/shim";

export class NBindBase { free?(): void }

export class NativeUtil extends NBindBase {
	/** NativeUtil(); */
	constructor();

	/** void storeBrowserHwnd(uint32_t); */
	storeBrowserHwnd(p0: number): void;

	/** void storeForegroundHwnd(); */
	storeForegroundHwnd(): void;

	/** void activateLastActiveHwnd(); */
	activateLastActiveHwnd(): void;

	/** void elevateExecute(std::string); */
	elevateExecute(p0: string): void;

	/** void queryEverything(std::string, int32_t, int32_t); */
	queryEverything(p0: string, p1: number, p2: number): void;

	/** std::vector<std::vector<std::string>> resolveEverything(); */
	resolveEverything(): (string[])[];
}
