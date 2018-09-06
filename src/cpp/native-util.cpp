#include <nbind/api.h>
#include <nbind/nbind.h>
#include <Windows.h>
#include <locale>
#include <codecvt>
#include "EverythingSDK/everything_ipc.h"
#include <Shlobj.h>
#include <wrl/client.h>

#define COPYDATA_QUERYCOMPLETE 0
#define GETDATA(data) (wchar_t *)(data + sizeof(DWORD))
using convert_typeX = std::codecvt_utf8<wchar_t>;
std::wstring StrToWStr(const std::string &str);
std::string WStrToStr(const std::wstring &wstr);
LRESULT CALLBACK window_proc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);

std::vector<std::vector<std::string>> ipcResultList;
bool ipcGotResult = false;

bool ShowContextMenu(HWND hwnd, std::string &path);

class NativeUtil
{
  public:
    NativeUtil()
    {
        CreateEverythingIPCWindow();
    }

    ~NativeUtil()
    {
        DestroyWindow(ipcHwnd);
    };

    void storeBrowserHwnd()
    {
        browserHwnd = FindWindow(NULL, L"ueli");
    }

    void elevateExecute(std::string arg)
    {
        LPCWSTR appName = StrToWStr(arg).c_str();
        SHELLEXECUTEINFO Shex;
        SecureZeroMemory(&Shex, sizeof(SHELLEXECUTEINFO));
        Shex.cbSize = sizeof(SHELLEXECUTEINFO);
        Shex.fMask = SEE_MASK_FLAG_NO_UI | SEE_MASK_NOCLOSEPROCESS;
        Shex.lpVerb = L"runas";
        Shex.lpFile = appName;
        Shex.nShow = SW_SHOWNORMAL;

        if (!ShellExecuteEx(&Shex))
        {
            DWORD Err = GetLastError();
            wprintf(
                L"%s could not be launched: %d\n",
                appName,
                Err);
            return;
        }

        _ASSERTE(Shex.hProcess);
    }

    void activateContextMenu(std::string filePath)
    {
        LPCWSTR pathW = StrToWStr(filePath).c_str();
        POINT pos;
        GetCursorPos(&pos);

        ITEMIDLIST *id = nullptr;
        HRESULT result = SHParseDisplayName(pathW, nullptr, &id, 0, nullptr);
        if (!SUCCEEDED(result) || !id)
        {
            return;
        }

        Microsoft::WRL::ComPtr<IShellFolder> iFolder = nullptr;
        LPCITEMIDLIST idChild = nullptr;
        result = SHBindToParent(id, IID_IShellFolder, (void **)&iFolder, &idChild);
        if (!SUCCEEDED(result) || !iFolder)
        {
            return;
        }

        Microsoft::WRL::ComPtr<IContextMenu> iMenu = nullptr;
        result = iFolder->GetUIObjectOf(browserHwnd, 1, (const ITEMIDLIST **)&idChild, IID_IContextMenu, nullptr, (void **)&iMenu);
        if (!SUCCEEDED(result) || !iFolder)
        {
            return;
        }

        HMENU hMenu = CreatePopupMenu();
        if (!hMenu)
        {
            return;
        }

        if (SUCCEEDED(iMenu->QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL)))
        {
            int iCmd = TrackPopupMenuEx(hMenu, TPM_RETURNCMD, pos.x, pos.y, browserHwnd, NULL);
            if (iCmd > 0)
            {
                CMINVOKECOMMANDINFOEX info = {0};
                info.cbSize = sizeof(info);
                info.fMask = CMIC_MASK_UNICODE | CMIC_MASK_ASYNCOK;
                info.hwnd = browserHwnd;
                info.lpVerb = MAKEINTRESOURCEA(iCmd - 1);
                info.lpVerbW = MAKEINTRESOURCEW(iCmd - 1);
                info.nShow = SW_SHOWNORMAL;

                iMenu->InvokeCommand((LPCMINVOKECOMMANDINFO)&info);
            }
        }

        DestroyMenu(hMenu);
    }

    void queryEverything(std::string queryInput, int maxResults, int matchOptions)
    {
        std::wstring wideQuery = StrToWStr(queryInput);
        wchar_t *search_string = &wideQuery[0];

        EVERYTHING_IPC_QUERY2 *query;
        int len;
        int size;
        COPYDATASTRUCT cds;

        ipcGotResult = false;
        ipcResultList.clear();

        HWND everything_hwnd = FindWindow(EVERYTHING_IPC_WNDCLASS, 0);
        if (everything_hwnd)
        {
            len = (wcslen(search_string) + 1) * sizeof(wchar_t);
            size = sizeof(EVERYTHING_IPC_QUERY2) + len;

            query = (EVERYTHING_IPC_QUERY2 *)HeapAlloc(GetProcessHeap(), 0, size);
            if (query)
            {
                query->max_results = maxResults;
                query->offset = 0;
                query->reply_copydata_message = COPYDATA_QUERYCOMPLETE;
                query->search_flags = matchOptions;
                query->reply_hwnd = (DWORD)ipcHwnd;
                query->request_flags = EVERYTHING_IPC_QUERY2_REQUEST_NAME | EVERYTHING_IPC_QUERY2_REQUEST_FULL_PATH_AND_NAME | EVERYTHING_IPC_QUERY2_REQUEST_EXTENSION;
                query->sort_type = EVERYTHING_IPC_SORT_NAME_ASCENDING;

                CopyMemory(query + 1, search_string, len);

                cds.cbData = size;
                cds.dwData = EVERYTHING_IPC_COPYDATA_QUERY2;
                cds.lpData = query;

                if (SendMessage(everything_hwnd, WM_COPYDATA, (WPARAM)ipcHwnd, (LPARAM)&cds) == TRUE)
                {
                    HeapFree(GetProcessHeap(), 0, query);
                    return;
                }
                else
                {
                    printf("NO IPC RUNNING\n");
                }

                HeapFree(GetProcessHeap(), 0, query);
            }
        }
        else
        {
            printf("NO EVERYTHING WINDOW\n");
        }

        return;
    }

    std::vector<std::vector<std::string>> resolveEverything()
    {
        std::vector<std::vector<std::string>> results;
        if (ipcGotResult)
        {
            results = ipcResultList;
        }

        return results;
    }

  private:
    void CreateEverythingIPCWindow()
    {
        WNDCLASSEX wcex;
        SecureZeroMemory(&wcex, sizeof(wcex));
        wcex.cbSize = sizeof(wcex);

        if (!GetClassInfoEx(GetModuleHandle(0), L"UELIIPCEVERYTHING", &wcex))
        {
            SecureZeroMemory(&wcex, sizeof(wcex));
            wcex.cbSize = sizeof(wcex);
            wcex.hInstance = GetModuleHandle(0);
            wcex.lpfnWndProc = window_proc;
            wcex.lpszClassName = L"UELIIPCEVERYTHING";

            if (!RegisterClassEx(&wcex))
            {
                printf("failed to register UELIIPCEVERYTHING window class\n");
                return;
            }
        }

        ipcHwnd = CreateWindow(
            L"UELIIPCEVERYTHING",
            L"",
            0,
            0, 0, 0, 0,
            0, 0, GetModuleHandle(0), 0);
        if (!(ipcHwnd))
        {
            printf("failed to create UELIIPCEVERYTHING window\n");
            return;
        }
    }
    HWND browserHwnd;
    HWND ipcHwnd;
};

NBIND_CLASS(NativeUtil)
{
    construct();
    method(storeBrowserHwnd);
    method(elevateExecute);
    method(queryEverything);
    method(resolveEverything);
    method(activateContextMenu);
}

std::wstring StrToWStr(const std::string &str)
{
    std::wstring_convert<convert_typeX, wchar_t> converterX;
    return converterX.from_bytes(str);
}

std::string WStrToStr(const std::wstring &wstr)
{
    std::wstring_convert<convert_typeX, wchar_t> converterX;
    return converterX.to_bytes(wstr);
}

enum
{
    ES_COLUMN_NAME,
    ES_COLUMN_FILENAME,
    ES_COLUMN_EXTENSION,
    ES_COLUMN_RUN_COUNT
};

LRESULT CALLBACK window_proc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    DWORD i;

    switch (uMsg)
    {
    case WM_COPYDATA:
    {
        COPYDATASTRUCT *cds = (COPYDATASTRUCT *)lParam;

        switch (cds->dwData)
        {
        case COPYDATA_QUERYCOMPLETE:

            EVERYTHING_IPC_LIST2 *list = (EVERYTHING_IPC_LIST2 *)cds->lpData;
            EVERYTHING_IPC_ITEM2 *items = (EVERYTHING_IPC_ITEM2 *)(list + 1);

            for (i = 0; i < list->numitems; i++)
            {
                std::vector<std::string> colection;
                EVERYTHING_IPC_ITEM2 item = items[i];

                char *p = ((char *)list) + items[i].data_offset;

                colection.push_back(WStrToStr(GETDATA(p))); // EVERYTHING_IPC_QUERY2_REQUEST_NAME

                DWORD len = *(DWORD *)p;
                p += sizeof(DWORD);
                p += (len + 1) * sizeof(wchar_t);

                colection.push_back(WStrToStr(GETDATA(p))); // EVERYTHING_IPC_QUERY2_REQUEST_FULL_PATH_AND_NAME

                colection.push_back((item.flags & EVERYTHING_IPC_FOLDER) ? "folder" : "file");
                ipcResultList.push_back(colection);
            }
            ipcGotResult = true;
            return true;
        }

        break;
    }
    }

    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}
