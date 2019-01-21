import { InputValidator } from "./input-validator";
import * as math from "mathjs";

math.config({
    number: "BigNumber",
    precision: 20,
});

export class CalculatorInputValidator implements InputValidator {
    public result: string;

    public isValidForSearchResults(userInput: string): boolean {
        if (userInput.startsWith("version")) {
            return false;
        }

        let result: any;
        try {
            // Mathjs throws an error when input cannot be evaluated
            result = math.eval(this.preprocessInput(userInput));
        } catch (e) {
            return false;
        }

        if (!isNaN(result) || this.isValidMathType(result)) {
            this.result = this.stringifyResult(result);
            return true;
        }

        return false;
    }

    private isValidMathType(input: any): boolean {
        if (input === undefined) {
            return false;
        }

        const mathType = math.typeof(input);

        if ((mathType === "Unit" && input.value === null)
            || (mathType === "Function")) {
            return false;
        }

        return true;
    }

    private preprocessInput(input: string): string {
        return input
            .replace(/0x[0-9a-f]+/ig, (m) => `number("${m}")`)
            .replace(/0b[01]+/g, (m) => `number("${m}")`);
    }

    private stringifyResult(value: any): string {
        if (value === null) {
            return "null";
        }

        let result = value.toString();

        if (result === "[object Object]") {
            result = JSON.stringify(result);
        }

        return result;
    }
}
