import { Program } from "./program";
import { ProgramRepository } from "./program-repository";

export class FakeProgramRepository implements ProgramRepository {
    private programs: Program[];

    public constructor(programs: Program[]) {
        this.programs = programs;
    }

    public async getPrograms(): Promise<Program[]> {
        return this.programs;
    }
}
