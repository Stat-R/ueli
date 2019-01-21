{
  "targets": [
    {
      "target_name": "nbind",
      "includes": [
		    "node_modules\\nbind\\src\\nbind.gypi"
	    ],
      "conditions": [
        ["OS=='win'", {
          "sources": [
            "src/cpp/native-util.cpp",
          ],
          "include_dirs": [
            "node_modules/nan",
            "<(module_root_dir)",
            "<(module_root_dir)/src/cpp/EverythingSDK/",
          ],
          "libraries": ["Gdiplus.lib"],
          "defines": [
            "NTDDI_VERSION=NTDDI_WIN7",
            "UNICODE"
          ],
          "msbuild_settings": {
            "ClCompile": {
              "LanguageStandard": "stdcpp17",
            }
          },
        }],
      ],
    },
  ],
}