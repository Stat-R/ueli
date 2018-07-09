![ueli logo](img/doc/readme-header.png)

# ueli
Original repo: https://github.com/oliverschwendener/ueli  
This repo contains personal modification, only supports Windows 10. Some requirements are needed to run correctly:

- ImageMagick (https://www.imagemagick.org/script/download.php) for blurry background.
- Spiceitfy (https://github.com/khanhas/spicetify) for Spotify search.

![musicplayer](https://i.imgur.com/eIvCyih.png)

![ueli screenshot](https://i.imgur.com/hFRUMHv.png)

## Table of contents

* [Installation](#installation)
* [Quick tutorial](#quick-tutorial)
* [Features](#features)
* [Customization](#customization)
* [Development](#development)
* [License](#license)

## Installation

### Installer / Zip
Download exe to install or zip to unzip manually.

## Quick tutorial

* Press `alt+space` to show/hide the window
* Start typing a program name
* Press Enter to launch the program

Full list of features in [wiki]()
### Keyboard shortcuts

|Keyboard shortcut|Description|
|---|---|
|`Ctrl+o`|Open the selected program or file at it's location|
|`ArrowUp`|Scroll up|
|`ArrowDown`|Scroll down|
|`F6`, `Ctrl+l`|Set focus on user input|
|`F1`|Get help|

Check out config file for mode and media player hotkeys

## Customization

All settings are stored in `~/ueli.config.json`. You can modify this file to change the default values.

### Options

* `applicationFileExtensions` Array of string - Represents the file extensions which are used to find applications in the specified folders
* `applicationFolders` Array of string - Represents the folders which are scanned for applications
* `autoStartApp` Boolean - If the app should be started automatically when you log in
* `colorTheme` String - Defines the [color theme](#color-themes).
* `customCommands` Arraay of customCommand objects - A list of [custom commands](#custom-commands)
    * `executionArgument` String - Represents the execution argument for the custom command
    * `name` String - Represents the displayed name for the custom command
    * `icon` String - (Optional) Represents the svg icon for the custom command. If no icon is set default icon is used.
* `maxSearchResultCount` Number - Maximum number of search results to be displayed
* `rescanInterval` Number - Interval in seconds to rescan the application folders
* `searchOperatingSystemSettings` Boolean - If operting system settings and commands should appear in the search results
* `searchResultExecutionArgumentFontSize` Number - Represents the font size of the search result execution argument in pixels
* `searchResultHeight` Number - Represents the height of a search result box in pixels
* `searchResultNameFontSize` Number - Represents the font size of the search result name in pixels
* `userInputFontSize` Number - Represents the font size of the user input in pixels
* `userInputHeight` Number - Represents the height of the user input box in pixels
* `webSearches` Array of webSearch Objects - A list of [web search engines](#web-search-engines)
    * `webSearch` Object - Defines a web search engine
        * `icon` String - Represents the svg icon for the specific web search engine
        * `name` String - Represents the name of the web search engine
        * `prefix` String - Represents the prefix for your web search engine. For example if the prefix is `g` you can type in `g?{your search term}` to search
        * `url` String - Represents the url for the search engine to which the search term is appended to. For example `https://google.com/search?q=`
* `windowWith`: Number - Represents the width of the main window in pixels

### Color themes

![Color themes](/img/doc/color-themes.png)

* `atom-one-dark`
* `dark`
* `dark-mono`
* `light`
* `light-mono`

### Requirements

* Git
* Node.js
* Yarn

### Setup

```
$ git clone https://github.com/khanhas/ueli
$ cd ueli
$ yarn
```

### Run

```
$ yarn electron-rebuild
$ yarn build
$ yarn start
```

> Note: there is also a watch task `$ yarn build:watch` which watches the stylesheets and typescript files and transpiles them automatically if there are any changes.

### Debug

> Note: for debugging you need Visual Studio Code

Choose one of these debug configurations:

![Debug configurations](img/doc/debug-configurations.png)

### Run tests

```
$ yarn test:unit
$ yarn test:integration
```

### Code coverage

```
$ yarn test:unit --coverage
```

### Package

```
$ yarn package
```

## License

Copyright (c) Oliver Schwendener. All rights reserved.

Licensed under the [MIT](LICENSE) License.
