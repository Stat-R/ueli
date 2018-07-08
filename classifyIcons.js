const fs =require("fs");

function c(f) {
    const d = fs.readFileSync(f, {encoding: "utf-8"});
    const t = {};
    fs.writeFileSync("./test.js", d.replace(/icon: (\u0060<path[\s\S]+?\/>\u0060)(,[\s\S]+?name:\s["\u0060]([\s\S]+?)["\u0060])/g, (a, b, c, d) => {
        if (!t[b]) {
            const name = d.replace(/ & /g, "And").replace(/\-/g, "").replace(/\$\{(.+?)\}\:\s/, "").replace(/\s/g, "");
            t[b] = name;
        }

        return "icon: Icons.WINDOWSSETTING_" + t[b].toUpperCase() + c;
    }));

    let manager = "";
    let enums = "";
    Object.keys(t).forEach(key => {
        manager += `public getWindowsSetting_${t[key]}Icon(): string {
return ${key};
}

`
        enums += `WINDOWSSETTING_${t[key].toUpperCase()} = "getWindowsSetting_${t[key]}Icon",\n`
    })

    fs.writeFileSync("./lmao.ts", manager);
    fs.writeFileSync("./lmao2.ts", enums);

}

[
    "./src/ts/search-plugins/windows-10-settings-plugin.ts",
    // "./src/ts/search-plugins/mac-os-settings-plugin.ts",
].forEach(file => c(file));
