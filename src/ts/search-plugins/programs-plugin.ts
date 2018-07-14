import { Icons } from "../icon-manager/icon-manager";
import { ProgramRepository } from "../programs-plugin/program-repository";
import { SearchResultItem } from "../search-result-item";
import { SearchPlugin } from "./search-plugin";

export class ProgramsPlugin implements SearchPlugin {
    private programRepository: ProgramRepository;

    public constructor(programRepository: ProgramRepository) {
        this.programRepository = programRepository;
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        return (await this.programRepository.getPrograms())
            .map((program) => ({
                alternativePrefix: "Run as Admin",
                breadCrumb: program.breadCrumb,
                executionArgument: program.executionArgument,
                icon: Icons.PROGRAM,
                name: program.name,
            } as SearchResultItem));
    }
}
