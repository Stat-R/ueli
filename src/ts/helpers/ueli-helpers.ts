import { homedir } from "os";
import { join } from "path";

export class UeliHelpers {
    public static readonly productName = "ueli";
    public static readonly ueliCommandPrefix = "ueli:";
    public static readonly configFilePath = join(homedir(), "ueli.config.json");
    public static readonly countFilePath = join(homedir(), "ueli.count.json");
    public static readonly cssFilePath = join(homedir(), "ueli.custom.css");
    public static readonly customCommandPrefix = "!";
}
