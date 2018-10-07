// @ts-check
/// <reference path="index.d.ts" />

const exec = require("child_process").exec;
const path = require("path");
const homedir = require("os").homedir;
const fs = require("fs");

const RAINMETER_EXE_PATH = "C:/Program Files/Rainmeter/Rainmeter.exe";
const PREFIX = "rm!";
const ICON = "<path d=\" M 23.054 8.735 L 24.464 10.146 C 25.593 11.274 26.439 12.685 27.004 14.096 C 28.132 17.058 28.132 20.162 27.004 23.124 C 26.439 24.535 25.593 25.946 24.464 27.074 C 23.336 28.203 21.925 29.049 20.514 29.613 C 17.552 30.742 14.448 30.742 11.486 29.613 C 10.075 29.049 8.805 28.203 7.677 27.215 C 6.407 26.087 5.42 24.676 4.855 23.124 C 4.291 21.713 4.15 20.162 4.15 18.61 C 4.15 17.058 4.432 15.506 4.996 14.096 C 5.561 12.685 6.407 11.274 7.536 10.146 L 9.652 8.029 L 11.909 5.772 L 14.025 3.656 L 16.141 1.54 L 18.257 3.656 L 23.054 8.735 Z  M 8.382 17.904 C 7.959 19.879 8.382 21.854 9.652 23.406 C 11.204 25.099 13.884 26.087 15.859 26.087 C 18.116 26.228 20.514 25.522 21.925 23.971 C 23.054 22.56 24.605 18.751 23.477 18.751 C 22.348 18.751 19.104 20.444 16.705 19.174 C 15.295 18.61 15.577 17.904 14.166 17.058 C 12.755 15.788 9.088 15.647 8.382 17.904 Z \"/>"
const SKIN_FOLDER = path.join(homedir(), "Documents/Rainmeter/Skins");

/**
 *
 * @param {string} folderPath
 * @param {string} rootConfig
 * @returns {string[]}
 */
function getConfigFromFolder(folderPath, rootConfig) {
    const configCollection = [];
    fs.readdirSync(folderPath).forEach((item) => {
        item = item.toLowerCase();
        const itemPath = path.join(folderPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
            if (item !== "@backup"
             && item !== "@vault"
             && item !== "@resources") {
                let childConfig = item;
                if (rootConfig) {
                    childConfig = `${rootConfig}\\${item}`
                }
                configCollection.push(...getConfigFromFolder(itemPath, childConfig));
            }
        } else if (path.extname(item).toLowerCase() === ".ini") {
            configCollection.push(rootConfig)
        }
    })

    return configCollection.filter((value, index, self) => self.indexOf(value) === index);
}

const validSkinConfig = getConfigFromFolder(SKIN_FOLDER, "");

/**
 *
 * @param {string} input
 * @returns {string[]}
 */
function splitByArg(input) {
    const splitted = input.split(" ");
    const output = [];
    let appendToLast = 0;
    splitted.forEach((item) => {
        if (item.startsWith('"') && item.endsWith('"')) {
            output.push(item);
        } else if (item.startsWith('"')) {
            output.push(item);
            appendToLast++;
        } else if (item.endsWith('"')) {
            if (appendToLast > 0) {
                appendToLast--;
                output[output.length - 1] = `${output[output.length - 1]} ${item}`
            } else {
                output.push(item);
            }
        } else {
            if (appendToLast > 0) {
                output[output.length - 1] = `${output[output.length - 1]} ${item}`
            } else {
                output.push(item);
            }
        }
    });

    return output;
}

module.exports.runSearcher = class Searcher {
    constructor() {
        this.needSort = false;
        this.shouldIsolate = true;
    }

    /**
     *
     * @param {Array<SearchResultItem>} inputItems
     * @param {string} searchTerm
     * @returns {Array<SearchResultItem>}
     */
    /* virtual */ fuzzySearcher(inputItems, searchTerm) { return []; }

    /**
     *
     * @param {string} input
     * @returns {Promise<Array<SearchResultItem>>}
     */
    async getSearchResult(input) {
        const trimmedInput = input.replace(PREFIX, "");
        const bangInput = splitByArg(trimmedInput);

        if (bangInput.length === 1) {
            const searchResults = BANG_LIST.map(this.mapBangToResult);
            if (trimmedInput) {
                return this.fuzzySearcher(searchResults, trimmedInput);
            } else {
                return searchResults;
            }
        } else {
            const validBang = BANG_LIST.filter((value) => {
                return value.bang.toLowerCase() === bangInput[0].toLowerCase();
            });

            if (validBang.length == 1) {
                let field = validBang[0].para[bangInput.length - 1 - 1];
                switch (field) {
                    case "Config":
                        const arg = bangInput.pop().replace(/\"/g, "");
                        const allConfig = validSkinConfig.map((item) => ({
                            breadCrumb: [`!${validBang[0].bang} ${validBang[0].para.join(" ")}`],
                            name: item,
                            executionArgument: `${PREFIX}${bangInput.join(" ")} ${item.indexOf(" ") === -1 ? item : `"${item}"`}`,
                            icon: ICON,
                        }));

                        if (arg) {
                            return this.fuzzySearcher(allConfig, arg);
                        }

                        return allConfig;
                }
                return [{
                    breadCrumb: [`!${validBang[0].bang} ${validBang[0].para.join(" ")}`],
                    executionArgument: input,
                    icon: ICON,
                    name: validBang[0].bang,
                }];
            }
        }

        return [];
    }

    /**
     *
     * @param {Bang} value
     * @returns {SearchResultItem}
     */
    mapBangToResult(value) {
        return {
            breadCrumb: [`!${value.bang} ${value.para.join(" ")}`],
            executionArgument: `${PREFIX}${value.bang}`,
            icon: ICON,
            name: value.bang,
        };
    }
}

module.exports.inputValidator = class Validator {
    /**
     *
     * @param {string} input
     * @returns {boolean}
     */
    isValidForSearchResults(input) {
        return input.startsWith(PREFIX);
    }

    /**
     *
     * @param {string} userInput
     * @returns {string[]} [Prefix symbols, prefix trimmed input, ...scopes[]]
     */
    getScopes(userInput) {
        const trimmed = userInput.substr(3);
        return [PREFIX, trimmed, "Bang"];
    }
}

module.exports.executionValidator = class ExecutionArgumentValidator {
    /**
     *
     * @param {string} arg
     * @returns {boolean}
     */
    isValidForExecution(arg) {
        return arg.startsWith(PREFIX);
    }
}

module.exports.executor = class Executor {
    constructor() {
        this.hideAfterExecution = true;
        this.resetUserInputAfterExecution = true;
        this.logExecution = false;
    }

    /**
     *
     * @param {string} arg
     */
    execute(arg) {
        const command = arg.replace(PREFIX, `"${RAINMETER_EXE_PATH}" !`);

        exec(command, (err) => {
            if (err) {
                throw err;
            }
        });
    }
}

module.exports.completer = class ArgumentCompleter {
    /**
     *
     * @param {string} userInput
     * @param {number} cavetPosition
     * @param {SearchResultItem} selectingResult
     */
    isCompletable(userInput, cavetPosition, selectingResult) {
        return selectingResult.executionArgument.startsWith(PREFIX);
    }

    /**
     *
     * @param {string} userInput
     * @param {number} cavetPosition
     * @param {SearchResultItem} selectingResult
     */
    complete(userInput, cavetPosition, selectingResult) {
        return [`${selectingResult.executionArgument} `];
    }
}

/**
 * @type {Bang[]}
 */
const BANG_LIST = [
    {
        bang: "TrayMenu",
        para: []
    },
    {
        bang: "ResetStats",
        para: []
    },
    {
        bang: "RefreshApp",
        para: []
    },
    {
        bang: "Quit",
        para: []
    },
    {
        bang: "SetClip",
        para: ["String"]
    },
    {
        bang: "SetWallpaper",
        para: ["FilePath", "Position"]
    },
    {
        bang: "About",
        para: ["TabName"]
    },
    {
        bang: "Manage",
        para: ["TabName", "Config", "File"]
    },
    {
        bang: "Log",
        para: ["String", "ErrorType"]
    },
    {
        bang: "LoadLayout",
        para: ["LayoutName"]
    },
    {
        bang: "SetOption",
        para: ["Section", "Key", "Value", "Config"]
    },
    {
        bang: "SetVariable",
        para: ["Variable", "Value", "Config"]
    },
    {
        bang: "WriteKeyValue",
        para: ["Section", "Key", "Value", "FilePath"]
    },
    {
        bang: "SetOptionGroup",
        para: ["Group", "Key", "Value", "Config"]
    },
    {
        bang: "SetVariableGroup",
        para: ["Variable", "Value", "Group"]
    },
    {
        bang: "Show",
        para: ["Config"]
    },
    {
        bang: "Hide",
        para: ["Config"]
    },
    {
        bang: "Toggle",
        para: ["Config"]
    },
    {
        bang: "ShowFade",
        para: ["Config"]
    },
    {
        bang: "HideFade",
        para: ["Config"]
    },
    {
        bang: "ToggleFade",
        para: ["Config"]
    },
    {
        bang: "FadeDuration",
        para: ["milliseconds", "Config"]
    },
    {
        bang: "ShowBlur",
        para: ["Config"]
    },
    {
        bang: "HideBlur",
        para: ["Config"]
    },
    {
        bang: "ToggleBlur",
        para: ["Config"]
    },
    {
        bang: "AddBlur",
        para: ["Region", "Config"]
    },
    {
        bang: "RemoveBlur",
        para: ["Region", "Config"]
    },
    {
        bang: "Move",
        para: ["X", "Y", "Config"]
    },
    {
        bang: "ActivateConfig",
        para: ["Config", "FilePath"]
    },
    {
        bang: "DeactivateConfig",
        para: ["Config"]
    },
    {
        bang: "ToggleConfig",
        para: ["Config", "FilePath"]
    },
    {
        bang: "Update",
        para: ["Config"]
    },
    {
        bang: "Redraw",
        para: ["Config"]
    },
    {
        bang: "Refresh",
        para: ["Config"]
    },
    {
        bang: "Delay",
        para: ["milliseconds"]
    },
    {
        bang: "SkinMenu",
        para: ["Config"]
    },
    {
        bang: "SkinCustomMenu",
        para: ["Config"]
    },
    {
        bang: "SetTransparency",
        para: ["Alpha", "Config"]
    },
    {
        bang: "ZPos",
        para: ["Position", "Config"]
    },
    {
        bang: "Draggable",
        para: ["Setting", "Config"]
    },
    {
        bang: "KeepOnScreen",
        para: ["Setting", "Config"]
    },
    {
        bang: "ClickThrough",
        para: ["Setting", "Config"]
    },
    {
        bang: "SnapEdges",
        para: ["Setting", "Config"]
    },
    {
        bang: "AutoSelectScreen",
        para: ["Setting", "Config"]
    },
    {
        bang: "EditSkin",
        para: ["Config", "FilePath"]
    },
    {
        bang: "ShowGroup",
        para: ["Group"]
    },
    {
        bang: "HideGroup",
        para: ["Group"]
    },
    {
        bang: "ToggleGroup",
        para: ["Group"]
    },
    {
        bang: "ShowFadeGroup",
        para: ["Group"]
    },
    {
        bang: "HideFadeGroup",
        para: ["Group"]
    },
    {
        bang: "ToggleFadeGroup",
        para: ["Group"]
    },
    {
        bang: "FadeDurationGroup",
        para: ["milliseconds", "Group"]
    },
    {
        bang: "DeactivateConfigGroup",
        para: ["Group"]
    },
    {
        bang: "UpdateGroup",
        para: ["Group"]
    },
    {
        bang: "RedrawGroup",
        para: ["Group"]
    },
    {
        bang: "RefreshGroup",
        para: ["Group"]
    },
    {
        bang: "SetTransparencyGroup",
        para: ["Alpha", "Group"]
    },
    {
        bang: "DraggableGroup",
        para: ["Setting", "Group"]
    },
    {
        bang: "ZPosGroup",
        para: ["Position", "Group"]
    },
    {
        bang: "KeepOnScreenGroup",
        para: ["Setting", "Group"]
    },
    {
        bang: "ClickThroughGroup",
        para: ["Setting", "Group"]
    },
    {
        bang: "SnapEdgesGroup",
        para: ["Setting", "Group"]
    },
    {
        bang: "AutoSelectScreenGroup",
        para: ["Setting", "Group"]
    },
    {
        bang: "ShowMeter",
        para: ["Meter", "Config"]
    },
    {
        bang: "HideMeter",
        para: ["Meter", "Config"]
    },
    {
        bang: "ToggleMeter",
        para: ["Meter", "Config"]
    },
    {
        bang: "UpdateMeter",
        para: ["Meter", "Config"]
    },
    {
        bang: "MoveMeter",
        para: ["X", "Y", "Meter", "Config"]
    },
    {
        bang: "ShowMeterGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "HideMeterGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "ToggleMeterGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "UpdateMeterGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "EnableMeasure",
        para: ["Measure", "Config"]
    },
    {
        bang: "DisableMeasure",
        para: ["Measure", "Config"]
    },
    {
        bang: "ToggleMeasure",
        para: ["Measure", "Config"]
    },
    {
        bang: "PauseMeasure",
        para: ["Measure", "Config"]
    },
    {
        bang: "UnpauseMeasure",
        para: ["Measure", "Config"]
    },
    {
        bang: "TogglePauseMeasure",
        para: ["Measure", "Config"]
    },
    {
        bang: "UpdateMeasure",
        para: ["Measure", "Config"]
    },
    {
        bang: "CommandMeasure",
        para: ["Measure", "Arguments", "Config"]
    },
    {
        bang: "EnableMeasureGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "DisableMeasureGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "ToggleMeasureGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "PauseMeasureGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "UnpauseMeasureGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "TogglePauseMeasureGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "UpdateMeasureGroup",
        para: ["Group", "Config"]
    },
    {
        bang: "DisableMouseAction",
        para: ["Meter", "MouseAction", "Config"]
    },
    {
        bang: "ClearMouseAction",
        para: ["Meter", "MouseAction", "Config"]
    },
    {
        bang: "EnableMouseAction",
        para: ["Meter", "MouseAction", "Config"]
    },
    {
        bang: "ToggleMouseAction",
        para: ["Meter", "MouseAction", "Config"]
    },
    {
        bang: "DisableMouseActionGroup",
        para: ["MouseAction", "Group", "Config"]
    },
    {
        bang: "ClearMouseActionGroup",
        para: ["MouseAction", "Group", "Config"]
    },
    {
        bang: "EnableMouseActionGroup",
        para: ["MouseAction", "Group", "Config"]
    },
    {
        bang: "ToggleMouseActionGroup",
        para: ["MouseAction", "Group", "Config"]
    },
    {
        bang: "DisableMouseActionSkinGroup",
        para: ["MouseAction", "Group"]
    },
    {
        bang: "ClearMouseActionSkinGroup",
        para: ["MouseAction", "Group"]
    },
    {
        bang: "EnableMouseActionSkinGroup",
        para: ["MouseAction", "Group"]
    },
    {
        bang: "ToggleMouseActionSkinGroup",
        para: ["MouseAction", "Group"]
    },
]