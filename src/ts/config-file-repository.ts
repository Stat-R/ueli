import { ConfigOptions } from "./config-options";
import * as fs from "fs";

export class ConfigFileRepository {
    private configFilePath: string;
    private defaultConfig: ConfigOptions;

    public constructor(defaultConfig: ConfigOptions, configFilePath: string) {
        this.configFilePath = configFilePath;
        this.defaultConfig = defaultConfig;

        if (!fs.existsSync(this.configFilePath)) {
            this.saveConfig(this.defaultConfig);
        }
    }

    public getConfig(): ConfigOptions {
        try {
            const fileContent = fs.readFileSync(this.configFilePath, "utf-8");
            const parsed = JSON.parse(fileContent) as ConfigOptions;

            // Apply defaults if some settings are not set
            const mergedConfig = parsed;
            let needRewrite = false;

            // Merge
            Object.keys(this.defaultConfig).forEach((option: keyof ConfigOptions) => {
                if (mergedConfig[option] === undefined) {
                    mergedConfig[option] = this.defaultConfig[option];
                    needRewrite = true;
                }
            });

            Object.keys(this.defaultConfig.features).forEach((option: keyof ConfigOptions["features"]) => {
                if (mergedConfig.features[option] === undefined) {
                    mergedConfig.features[option] = this.defaultConfig.features[option];
                    needRewrite = true;
                }
            });

            if (needRewrite) {
                this.saveConfig(mergedConfig);
            }

            return mergedConfig;
        } catch (err) {
            return this.defaultConfig;
        }
    }

    public saveConfig(config: ConfigOptions): void {
        fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2), "utf-8");
    }
}
