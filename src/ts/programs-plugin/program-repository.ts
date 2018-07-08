import { Program } from "./program";

export interface ProgramRepository {
    getPrograms(): Promise<Program[]>;
}
