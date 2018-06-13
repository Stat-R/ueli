import * as os from "os";
import { IconManager } from "../icon-manager/icon-manager";
import { Injector } from "../injector";
import { Program } from "../programs-plugin/program";
import { ProgramRepository } from "../programs-plugin/program-repository";
import { SearchResultItem } from "../search-result-item";
import { SearchPlugin } from "./search-plugin";
import { ConfigOptions } from "../config-options";

export class ProgramsPlugin implements SearchPlugin {
    private programs: Program[];
    private iconManager: IconManager;
    private dirSep: string;

    public constructor(programRepository: ProgramRepository) {
        this.iconManager = Injector.getIconManager(os.platform());
        this.programs = programRepository.getPrograms();
    }

    public getAllItems(): SearchResultItem[] {
        return this.programs.map((program): SearchResultItem => {
            return {
                breadCrumb: program.breadCrumb,
                executionArgument: program.executionArgument,
                icon: this.iconManager.getProgramIcon(),
                name: program.name,
                tags: [],
            } as SearchResultItem;
        });
    }
}
