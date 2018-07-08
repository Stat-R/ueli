#include <nbind/api.h>
#include <nbind/nbind.h>
#include <Windows.h>

class NativeUtil
{
  public:
    NativeUtil(UINT hwnd)
    {
        browserHwnd = hwnd;
    }

    ~NativeUtil(){};

    void storeForegroundHwnd()
    {
        const HWND hwnd = GetForegroundWindow();
        if ((UINT)hwnd != browserHwnd)
        {
            lastActiveHwnd = hwnd;
        }
    }

    void activateLastActiveHwnd()
    {
        SwitchToThisWindow(lastActiveHwnd, true);
        SetWindowPos(lastActiveHwnd, HWND_TOP, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
    }

    void elevateExecute(std::string arg)
    {
        LPCSTR appName = arg.c_str();
        printf("Command: %s", appName);
        SHELLEXECUTEINFO Shex;
        ZeroMemory(&Shex, sizeof(SHELLEXECUTEINFO));
        Shex.cbSize = sizeof(SHELLEXECUTEINFO);
        Shex.fMask = SEE_MASK_FLAG_NO_UI | SEE_MASK_NOCLOSEPROCESS;
        Shex.lpVerb = "runas";
        Shex.lpFile = appName;
        Shex.nShow = SW_SHOWNORMAL;

        if (!ShellExecuteEx(&Shex))
        {
            DWORD Err = GetLastError();
            printf(
                "%s could not be launched: %d\n",
                appName,
                Err);
            return;
        }

        _ASSERTE(Shex.hProcess);

        if (false) //Wait
        {
            WaitForSingleObject(Shex.hProcess, INFINITE);
        }
    }

  private:
    UINT browserHwnd;
    HWND lastActiveHwnd;
};

NBIND_CLASS(NativeUtil)
{
    construct<UINT>();
    method(storeForegroundHwnd);
    method(activateLastActiveHwnd);
    method(elevateExecute);
}