![ueli logo](img/doc/readme-header.png)

# ueli
Original repo: https://github.com/oliverschwendener/ueli  
This repo contains personal modification, only supports Windows 10. Some requirements are needed to run correctly:

- ImageMagick (https://www.imagemagick.org/script/download.php) for blurry background.
    - When installing, check `Add application directory to system path`. And it will work out of the box.
    - If you are in situation that you can't change system path (`magick` can't be run in terminal), set `imageMagickPath` to `magick.exe`'s full path in config file.
    - If you don't want to have blurry background at all, set `imageMagickPath` to `no` in config file.
- Spicetify (https://github.com/khanhas/spicetify) for Spotify search and control player.
    - If you are also using WebNowPlaying in one of your skin in Rainmeter, it's best to use another port for Spotify to communicate with UELI:
        - Save this [file](https://gist.github.com/khanhas/43dea6becd480390487df7b0ffc84dfd) to `Documents\Rainmeter\Skins\Spicetify\Extensions`
        - Activate and inject `WebNowPlaying for UELI` in Spicetify. Restart Spotify.
        - Change `musicPlayerWebSocketPort` to `3928`
        - Reload UELI
- Everything (https://www.voidtools.com/) to search all files in all drives in split of second.

![musicplayer](https://i.imgur.com/QS0hbaP.png)

![ueli screenshot](https://i.imgur.com/puqLKub.png)

## Table of contents

* [Installation](#installation)
* [Quick tutorial](#quick-tutorial)
* [Features](#features)
* [Customization](#customization)
* [Development](#development)
* [License](#license)

## Installation
[**Download**](https://github.com/khanhas/ueli/releases) exe to install or zip to unzip manually.

## Quick tutorial

* Press `alt+space` to show/hide the window
* Start typing a program name
* Press Enter to launch the program

## Features
- [Run mode](https://github.com/khanhas/ueli/wiki/Run-mode)
    * [Programs search](https://github.com/khanhas/ueli/wiki/Run-mode#program-search)
    * [Files and folder search](https://github.com/khanhas/ueli/wiki/Run-mode#files-and-folder-search)
    * [Open URL with web browser](https://github.com/khanhas/ueli/wiki/Run-mode#open-urls-with-your-default-web-browser)
    * [Web search engines](https://github.com/khanhas/ueli/wiki/Run-mode#web-search-engines)
    * [Execute commandline tool](https://github.com/khanhas/ueli/wiki/Run-mode#execute-commandline-tool)
    * [Browse file system](https://github.com/khanhas/ueli/wiki/Run-mode#browse-file-system)
    * [Calculator](https://github.com/khanhas/ueli/wiki/Run-mode#calculator)
    * [Custom commands](https://github.com/khanhas/ueli/wiki/Run-mode#custom-commands)
    * [Environment variables](https://github.com/khanhas/ueli/wiki/Run-mode#environment-variables)
- [Windows mode](https://github.com/khanhas/ueli/wiki/Windows-mode)  
    Search and open running applications.
- [Online mode](https://github.com/khanhas/ueli/wiki/Online-mode)
    * [Spotify](https://github.com/khanhas/ueli/wiki/Online-mode#search-spotify)
    * [Youtube](https://github.com/khanhas/ueli/wiki/Online-mode#search-youtube)
- [Everything mode](https://github.com/khanhas/ueli/wiki/Everything-mode)  
    Search files instantly with Search Everything from VoidTools

### Keyboard shortcuts

|Keyboard shortcut|Description|
|---|---|
|`Ctrl + o`|Open the selected program or file at it's location|
|`Ctrl + Shift + C`|Copy file/folder full path to clipboard|
|`ArrowUp`|Scroll up|
|`ArrowDown`|Scroll down|
|`F6`, `Ctrl + L`|Set focus on user input|

Hold `Alt` when opening an executable to run as adminstrator.  
Hold `Alt` when opening an folder to open it in text editor.  

Check out config file for mode and media player hotkeys.

## Customization

All settings are stored in `~/ueli.config.json`. You can modify this file to change the default values.

Option | Type | Description
---|---|---
`applicationFileExtensions` | string[] | File extensions which are used to find applications in the specified folders. 
`applicationFolders` | [`path`, `alias`][] | `path` is the folder path which are scanned for applications, `alias` is for search result description.
`applicationKeywordBlacklist` | string[] | List of keyword to excluding application from search results, like `uninstall` or `help`
`autoStartApp` | boolean | If the app should be started automatically when you log in
`bookmarkFromBrowser` | string | Browser to get bookmark from. Valid values: `firefox`, `chrome`, `vivaldi`, `opera`, `chromium`.
`bookmarkProfileName` | string | https://github.com/khanhas/ueli/wiki/Browser-bookmark-search
`customCommands` | customCommand[] | A list of customCommand.
`directorySeparator` | string | Separator for search result description
`everythingFilterFilePath` | string | Path to Everything's filters CSV file.
`everythingMaxResults` | number | Number of result returns when searching in Everything mode.
`hotkeyEverythingMode` | string | 
`hotkeyOnlineMode` | string |
`hotkeyRunMode` | string |
`hotkeyWindowsMode` | string |
`imageMagickPath` | string | Path to `magick.exe`. 
`maxSearchResultCount` | number | Maximum number of search results to be displayed
`musicPlayerHotkeyBack` | string |
`musicPlayerHotkeyLike` | string | 
`musicPlayerHotkeyMute` | string | 
`musicPlayerHotkeyNext` | string | 
`musicPlayerHotkeyPlayPause` | string | 
`musicPlayerLocalName` | string | Valid values: `aimp`, `cad`, `foobar`, `itunes`, `mediamonkey`, `spotify`, `winamp`, `wmp`
`musicPlayerSmallSize` | boolean | Wheather using small player
`musicPlayerType` | string | `websocket` or `local`
`musicPlayerWebSocketPort` | number | Port to use when communicating with player to get information.
`onlineModeDelay` | number | In milisecond. Delays an amount of time before starting to search.  
`powerShellPath` | string | Set path to custom powershell cli. Useful for anyone want to use Powershell Core 6 instead of default Windows Powershell.
`searchOperatingSystemSettings` | boolean | If operting system settings and commands should appear in the search results
`searchResultExecutionArgumentFontSize` | number | Font size of the search result execution argument in pixels
`searchResultHeight` | number | Height of a search result box in pixels
`searchResultNameFontSize` | number | Font size of the search result name in pixels
`textEditor` | textEditor | Set your favourite editor to open folder with it. 
`userInputFontSize` | number | Font size of the user input in pixels
`userInputHeight` | number | Height of the user input box in pixels
`webSearches` | webSearchEngine[] | A list of webSearchEngines
`windowWidth` | number | Width of the main window in pixels 

### `customCommand` object
- `executionArgument` string - Execution argument for the custom command. Prefix `>` to execute command in UELI command line.
- `name` string - Displayed name for the custom command
- `icon` string - (Optional) SVG icon for the custom command. If no icon is set default icon is used.

### `textEditor` object
- `name` string - Displayed name for the editor
- `path` string - Path to the editor exe.

### `webSearchEngine` object
- `icon` string - SVG icon for the specific web search engine
- `name` string - Name of the web search engine
- `prefix` string - Prefix for your web search engine. For example if the prefix is `g` you can type in `g?{your search term}` to search
- `url` string url for the search engine to which the search term is appended to. For example `https://google.com/search?q=`

## Development

### Requirements

* Git
* Node.js
* Yarn

### Setup

```bash
git clone https://github.com/khanhas/ueli
cd ueli
yarn
```

### Run

```bash
yarn electron-rebuild
yarn build
yarn start
```

> Note: there is also a watch task `$ yarn build:watch` which watches the stylesheets and typescript files and transpiles them automatically if there are any changes.

### Debug

> Note: for debugging you need Visual Studio Code

Choose one of these debug configurations:

![Debug configurations](img/doc/debug-configurations.png)

### Package

```bash
yarn package
```

For distributing:
```bash
yarn package:publish
```


## License

Copyright (c) Oliver Schwendener. All rights reserved.

Licensed under the [MIT](LICENSE) License.
