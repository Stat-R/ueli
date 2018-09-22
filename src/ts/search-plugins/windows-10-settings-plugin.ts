import { SearchPlugin } from "./search-plugin";
import { WindowsSettingsHelpers } from "../helpers/windows-settings-helpers";
import { IconsWindowsSetting } from "../icon-manager/icon-manager";
import { SearchResultItem } from "../search-result-item";

export class Windows10SettingsSearchPlugin implements SearchPlugin {
    private items = [] as SearchResultItem[];

    constructor() {
        this.addToItems(this.getSystemSettings());
        this.addToItems(this.getDeviceSettings());
        this.addToItems(this.getNetworkSettings());
        this.addToItems(this.getPersonalizationSettings());
        this.addToItems(this.getAppSettings());
        this.addToItems(this.getAccountSettings());
        this.addToItems(this.getCortanaSettings());
        this.addToItems(this.getTimeAndLanguageSettings());
        this.addToItems(this.getGamingSettings());
        this.addToItems(this.getEaseOfAccessSettings());
        this.addToItems(this.getPrivacySettings());
        this.addToItems(this.getUpdateAndSecuritySettings());
        this.addToItems(this.getSystemCommands());
        this.addToItems(this.getWindows10Apps());
    }

    public async getAllItems(): Promise<SearchResultItem[]> {
        return this.items.map((item) => {
            item.hideDescription = true;
            return item;
        });
    }

    private addToItems(items: SearchResultItem[]) {
        this.items = this.items.concat(items);
        items.length = 0;
    }

    private getSystemSettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:`,
                icon: IconsWindowsSetting.SETTINGS,
                name: "Settings",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:batterysaver`,
                icon: IconsWindowsSetting.BATTERY,
                name: "Battery",
                tags: ["power", "energy", "saving", "save"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:display`,
                icon: IconsWindowsSetting.DISPLAY,
                name: "Display",
                tags: ["screen", "resolution", "4k", "hd"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:notifications`,
                icon: IconsWindowsSetting.NOTIFICATIONSANDACTIONS,
                name: "Notifications & actions",
                tags: ["notify", "action"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:powersleep`,
                icon: IconsWindowsSetting.POWERANDSLEEP,
                name: "Power & sleep",
                tags: ["energy", "plan"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:storagesense`,
                icon: IconsWindowsSetting.STORAGE,
                name: "Storage",
                tags: ["hard", "disk", "ssd", "hdd"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:tabletmode`,
                icon: IconsWindowsSetting.TABLETMODE,
                name: "Tablet mode",
                tags: ["mobile", "touch"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:project`,
                icon: IconsWindowsSetting.PROJECTINGTOTHISPC,
                name: "Projecting to this PC",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:multitasking`,
                icon: IconsWindowsSetting.MULTITASKING,
                name: "Multitasking",
                tags: ["windows", "window", "manager", "snap", "virtual", "desktop"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:remotedesktop`,
                icon: IconsWindowsSetting.DISPLAY,
                name: "Remote Desktop",
                tags: ["connection"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:about`,
                icon: IconsWindowsSetting.ABOUTYOURPC,
                name: "About your PC",
                tags: ["system", "device", "specs", "specifications", "license", "info", "information"],
            },
        ] as SearchResultItem[];
    }

    private getDeviceSettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:bluetooth`,
                icon: IconsWindowsSetting.BLUETOOTH,
                name: "Bluetooth",
                tags: ["wireless", "device", "devices"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:printers`,
                icon: IconsWindowsSetting.PRINTERSANDSCANNERS,
                name: "Printers & Scanners",
                tags: ["devices"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:mousetouchpad`,
                icon: IconsWindowsSetting.TOUCHPAD,
                name: "Touchpad",
                tags: ["input"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:typing`,
                icon: IconsWindowsSetting.TYPING,
                name: "Typing",
                tags: ["input", "keyboard"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:pen`,
                icon: IconsWindowsSetting.PENANDWINDOWSINK,
                name: "Pen & Windows Ink",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:autoplay`,
                icon: IconsWindowsSetting.AUTOPLAY,
                name: "Autoplay",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:usb`,
                icon: IconsWindowsSetting.USB,
                name: "USB",
                tags: ["devices"],
            },
        ] as SearchResultItem[];
    }

    private getNetworkSettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network`,
                icon: IconsWindowsSetting.NETWORKSTATUS,
                name: "Network status",
                tags: ["internet"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network-ethernet`,
                icon: IconsWindowsSetting.ETHERNET,
                name: "Ethernet",
                tags: ["network", "internet", "wireless"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network-wifi`,
                icon: IconsWindowsSetting.WIFI,
                name: "Wi-Fi",
                tags: ["network", "internet", "wireless"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network-dialup`,
                icon: IconsWindowsSetting.DIALUP,
                name: "Dial-up",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network-vpn`,
                icon: IconsWindowsSetting.VPN,
                name: "VPN",
                tags: ["vate", "virtual", "network", "vacy"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network-airplanemode`,
                icon: IconsWindowsSetting.AIRPLANEMODE,
                name: "Airplane mode",
                tags: ["offline"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network-mobilehotspot`,
                icon: IconsWindowsSetting.MOBILEHOTSPOT,
                name: "Mobile hotspot",
                tags: ["network", "internet"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:datausage`,
                icon: IconsWindowsSetting.DATAUSAGE,
                name: "Data Usage",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:network-proxy`,
                icon: IconsWindowsSetting.PROXY,
                name: "Proxy",
                tags: ["network"],
            },
        ] as SearchResultItem[];
    }

    private getPersonalizationSettings(): SearchResultItem[] {
        const moduleTitle = "Personalization";

        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:personalization-background`,
                icon: IconsWindowsSetting.BACKGROUND,
                name: `${moduleTitle}: Background`,
                tags: ["custom", "customization", "colors", "images", "pictures", "wallpapers"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:colors`,
                icon: IconsWindowsSetting.COLORS,
                name: `${moduleTitle}: Colors`,
                tags: ["color", "custom", "customization", "creative"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:lockscreen`,
                icon: IconsWindowsSetting.LOCKSCREEN,
                name: `${moduleTitle}: Lock screen`,
                tags: ["screen", "saver"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:themes`,
                icon: IconsWindowsSetting.THEMES,
                name: `${moduleTitle}: Themes`,
                tags: ["custom", "customization", "color", "colors", "image", "picture"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:personalization-start`,
                icon: IconsWindowsSetting.START,
                name: `${moduleTitle}: Start`,
                tags: ["custom", "customization", "search"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:taskbar`,
                icon: IconsWindowsSetting.TASKBAR,
                name: `${moduleTitle}: Taskbar`,
            },
        ] as SearchResultItem[];
    }

    private getAppSettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:appsfeatures`,
                icon: IconsWindowsSetting.APPSANDFEATURES,
                name: "Apps & features",
                tags: ["programs"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:defaultapps`,
                icon: IconsWindowsSetting.APPSANDFEATURES,
                name: "Default apps",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:optionalfeatures`,
                icon: IconsWindowsSetting.OPTIONALFEATURES,
                name: "Optional features",
                tags: ["additional"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:maps`,
                icon: IconsWindowsSetting.OFFLINEMAPS,
                name: "Offline maps",
                tags: ["earth"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:appsforwebsites`,
                icon: IconsWindowsSetting.APPSFORWEBSITES,
                name: "Apps for websites",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:videoplayback`,
                icon: IconsWindowsSetting.VIDEOPLAYBACK,
                name: "Video playback",
            },
        ] as SearchResultItem[];
    }

    private getAccountSettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:yourinfo`,
                icon: IconsWindowsSetting.YOURINFO,
                name: "Your info",
                tags: ["account", "user", "about"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:emailandaccounts`,
                icon: IconsWindowsSetting.EMAILANDAPPACCOUNTS,
                name: "Email & app accounts",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:signinoptions`,
                icon: IconsWindowsSetting.SIGNINOPTIONS,
                name: "Sign-in options",
                tags: ["password", "change", "security", "secret", "account", "pin"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:workplace`,
                icon: IconsWindowsSetting.ACCESSWORKORSCHOOL,
                name: "Access work or school",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:otherusers`,
                icon: IconsWindowsSetting.FAMILYANDOTHERUSERS,
                name: "Family & other users",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:sync`,
                icon: IconsWindowsSetting.SYNCYOURSETTINGS,
                name: "Sync your settings",
            },
        ] as SearchResultItem[];
    }

    private getTimeAndLanguageSettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:dateandtime`,
                icon: IconsWindowsSetting.DATEANDTIME,
                name: "Date & Time",
                tags: ["clock"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:regionlanguage`,
                icon: IconsWindowsSetting.REGIONANDLANGUAGE,
                name: "Region & language",
                tags: ["locale"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:speech`,
                icon: IconsWindowsSetting.SPEECH,
                name: "Speech",
            },
        ] as SearchResultItem[];
    }

    private getGamingSettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:gaming-broadcasting`,
                icon: IconsWindowsSetting.GAMING,
                name: "Broadcasting",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:gaming-gamebar`,
                icon: IconsWindowsSetting.GAMING,
                name: "Game bar",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:gaming-gamedvr`,
                icon: IconsWindowsSetting.GAMING,
                name: "Game DVR",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:gaming-gamemode`,
                icon: IconsWindowsSetting.GAMEMODE,
                name: "Game Mode",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:gaming-trueplay`,
                icon: IconsWindowsSetting.GAMING,
                name: "TruePlay",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:gaming-xboxnetworking`,
                icon: IconsWindowsSetting.XBOXNETWORKING,
                name: "Xbox Networking",
            },
        ] as SearchResultItem[];
    }

    private getEaseOfAccessSettings(): SearchResultItem[] {
        const moduleTitle = "Ease of Access";

        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:easeofaccess-narrator`,
                icon: IconsWindowsSetting.NARRATOR,
                name: `${moduleTitle}: Narrator`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:easeofaccess-magnifier`,
                icon: IconsWindowsSetting.MAGNIFIER,
                name: `${moduleTitle}: Magnifier`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:easeofaccess-highcontrast`,
                icon: IconsWindowsSetting.COLORANDHIGHCONTRAST,
                name: `${moduleTitle}: Color & high Contrast`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:easeofaccess-closedcaptioning`,
                icon: IconsWindowsSetting.CLOSEDCAPTIONING,
                name: `${moduleTitle}: Closed Captioning`,
                tags: ["cc"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:easeofaccess-keyboard`,
                icon: IconsWindowsSetting.TYPING,
                name: `${moduleTitle}: Keyboard`,
                tags: ["input"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:easeofaccess-mouse`,
                icon: IconsWindowsSetting.MOUSE,
                name: `${moduleTitle}: Mouse`,
                tags: ["ease", "of", "access", "input"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:easeofaccess-otheroptions`,
                icon: IconsWindowsSetting.SETTINGS,
                name: `${moduleTitle}: Other Options`,
            },
        ] as SearchResultItem[];
    }

    private getPrivacySettings(): SearchResultItem[] {
        const moduleTitle = "Privacy";

        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-general`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: General`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-location`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Location`,
                tags: ["gps"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-webcam`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Camera`,
                tags: ["web cam"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-microphone`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Microphone`,
                tags: ["audio", "input"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-notifications`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Notifications`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-speechtyping`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Speech, ing, & typing`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-accountinfo`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Account info`,
                tags: ["personal", "vacy", "user"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-contacts`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Contacts`,
                tags: ["people"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-calendar`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Calendar`,
                tags: ["day", "month", "year"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-callhistory`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Call history`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-email`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Email`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-tasks`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Tasks`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-messaging`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Messaging`,
                tags: ["message"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-radios`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Radios`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-customdevices`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Other Devices`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-feedback`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Feedback & diagnostics`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-backgroundapps`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Background apps`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-appdiagnostics`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: App diagnostics`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:automaticfiledownloads`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Automatic file downloads`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:privacy-motion`,
                icon: IconsWindowsSetting.PRIVACY,
                name: `${moduleTitle}: Motion`,
            },
        ] as SearchResultItem[];
    }

    private getUpdateAndSecuritySettings(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:windowsupdate`,
                icon: IconsWindowsSetting.SYNCYOURSETTINGS,
                name: "Windows Update",
                tags: ["patch", "upgrade", "security"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:windowsdefender`,
                icon: IconsWindowsSetting.WINDOWSDEFENDER,
                name: "Windows Defender",
                tags: ["anti", "virus", "protection", "security", "scan", "malware"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:backup`,
                icon: IconsWindowsSetting.BACKUP,
                name: "Backup",
                tags: ["files", "storage"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:troubleshoot`,
                icon: IconsWindowsSetting.TROUBLESHOOT,
                name: "Troubleshoot",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:recovery`,
                icon: IconsWindowsSetting.RECOVERY,
                name: "Recovery",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:activation`,
                icon: IconsWindowsSetting.ACTIVATION,
                name: "Activation",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:findmydevice`,
                icon: IconsWindowsSetting.FINDMYDEVICE,
                name: "Find my device",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:developers`,
                icon: IconsWindowsSetting.FORDEVELOPERS,
                name: "For developers",
                tags: ["dev", "admin"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:windowsinsider`,
                icon: IconsWindowsSetting.SETTINGS,
                name: "Windows Insider Program",
            },
        ] as SearchResultItem[];
    }

    private getCortanaSettings(): SearchResultItem[] {
        const moduleTitle = "Cortana";

        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:cortana-language`,
                icon: IconsWindowsSetting.CORTANA,
                name: `${moduleTitle}: Talk to Cortana`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:cortana-moredetails`,
                icon: IconsWindowsSetting.CORTANA,
                name: `${moduleTitle}: More details`,
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings:cortana-notifications`,
                icon: IconsWindowsSetting.CORTANA,
                name: `${moduleTitle}: Notifications`,
            },
        ] as SearchResultItem[];
    }

    private getSystemCommands(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}shutdown -s -t 0`,
                icon: IconsWindowsSetting.SHUTDOWN,
                name: "Shutdown",
                tags: ["power", "off"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}shutdown -r -t 0`,
                icon: IconsWindowsSetting.RESTART,
                name: "Restart",
                tags: ["reboot"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}shutdown /l`,
                icon: IconsWindowsSetting.SIGNOUT,
                name: "Sign out",
                tags: ["out", "off", "sign", "user", "log"],
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}rundll32 user32.dll,LockWorkStation`,
                icon: IconsWindowsSetting.LOCKCOMPUTER,
                name: "Lock computer",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}winver`,
                icon: IconsWindowsSetting.WINDOWSVERSION,
                name: "Windows Version",
                tags: ["about", "info", "build", "os", "operating", "system", "release"],
            },
        ] as SearchResultItem[];
    }

    private getWindows10Apps(): SearchResultItem[] {
        return [
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}com.microsoft.builder3d:`,
                icon: IconsWindowsSetting.THREEDBUILDER,
                name: "3D Builder",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-actioncenter:`,
                icon: IconsWindowsSetting.NOTIFICATIONSANDACTIONS,
                name: "Action Center",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-clock:alarm`,
                icon: IconsWindowsSetting.ALARMSANDCLOCK,
                name: "Alarms & Clock",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-availablenetworks:`,
                icon: IconsWindowsSetting.NETWORKSTATUS,
                name: "Available Networks",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}calculator:`,
                icon: IconsWindowsSetting.CALCULATOR,
                name: "Calculator",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}outlookcal:`,
                icon: IconsWindowsSetting.CALENDAR,
                name: "Calendar",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}microsoft.windows.camera:`,
                icon: IconsWindowsSetting.CAMERA,
                name: "Camera",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-projection:`,
                icon: IconsWindowsSetting.CONNECT,
                name: "Connect",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-cortana:`,
                icon: IconsWindowsSetting.CORTANA,
                name: "Cortana",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-settings-connectabledevices:devicediscovery`,
                icon: IconsWindowsSetting.DEVICEDISCOVERY,
                name: "Device Discovery",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-contact-support:`,
                icon: IconsWindowsSetting.GETHELP,
                name: "Get Help",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}mswindowsmusic:`,
                icon: IconsWindowsSetting.GROOVEMUSIC,
                name: "Groove Music",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}outlookmail:`,
                icon: IconsWindowsSetting.EMAILANDAPPACCOUNTS,
                name: "Mail",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}bingmaps:`,
                icon: IconsWindowsSetting.OFFLINEMAPS,
                name: "Maps",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}microsoft-edge:`,
                icon: IconsWindowsSetting.MICROSOFTEDGE,
                name: "Microsoft Edge",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-windows-store:`,
                icon: IconsWindowsSetting.MICROSOFTSTORE,
                name: "Microsoft Store",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-holocamera:`,
                icon: IconsWindowsSetting.MIXEDREALITYCAMERA,
                name: "Mixed Reality Camera",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-holographicfirstrun:`,
                icon: IconsWindowsSetting.MIXEDREALITYCAMERA,
                name: "Mixed Reality Portal",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}mswindowsvideo:`,
                icon: IconsWindowsSetting.MOVIESANDTV,
                name: "Movies & TV",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}bingnews:`,
                icon: IconsWindowsSetting.NEWS,
                name: "News",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}onenote:`,
                icon: IconsWindowsSetting.ONENOTE,
                name: "OneNote",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-paint:`,
                icon: IconsWindowsSetting.COLORS,
                name: "Paint 3D",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-people:`,
                icon: IconsWindowsSetting.PEOPLE,
                name: "People",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-get-started:`,
                icon: IconsWindowsSetting.TIPS,
                name: "Tips",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}com.microsoft.3dviewer:`,
                icon: IconsWindowsSetting.THREEDBUILDER,
                name: "View 3D Preview",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-callrecording:`,
                icon: IconsWindowsSetting.SPEECH,
                name: "Voice Recorder",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}bingweather:`,
                icon: IconsWindowsSetting.WEATHER,
                name: "Weather",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}windowsdefender:`,
                icon: IconsWindowsSetting.WINDOWSDEFENDER,
                name: "Windows Defender Security Center",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}ms-wpc:`,
                icon: IconsWindowsSetting.FAMILYANDOTHERUSERS,
                name: "Windows Parental Controls",
            },
            {
                executionArgument: `${WindowsSettingsHelpers.windowsSettingsPrefix}xbox:`,
                icon: IconsWindowsSetting.XBOXNETWORKING,
                name: "Xbox",
            },
        ] as SearchResultItem[];
    }
}
