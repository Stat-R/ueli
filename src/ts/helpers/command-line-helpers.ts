import { StringHelpers } from "./string-helpers";
import { CommandLineProgram } from "../command-line-program";

export class CommandLineHelpers {
    public static readonly commandLinePrefix = ">";

    public static buildCommand(executionArgument: string): CommandLineProgram {
        const words = StringHelpers.stringToWords(executionArgument);
        words[0] = words[0].replace(CommandLineHelpers.commandLinePrefix, "");

        words.unshift("-Command");

        return {
            args: words,
            name: "powershell.exe",
        } as CommandLineProgram;
    }
}
