{
  "targets": [
    {
      "target_name": "nbind",
      "includes": [
		    "auto.gypi"
	    ],
      "conditions": [
        ["OS=='win'", {
          "sources": [
            "src/cpp/native-util.cpp",
          ],
          "include_dirs": [
            "node_modules\\nan",
            "<(module_root_dir)",
          ],
          "libraries": ["Mincore.lib", "gdiplus.lib","Shlwapi.lib","Dwmapi.lib", "Version.lib"],
          "defines": [
            "NTDDI_VERSION=NTDDI_WIN7"
          ],
        }],
      ],
    },
    {
			"target_name": "copy_binary",
			"type":"none",
			"dependencies": [ "nbind" ],
			"copies": [
				{
					'destination': '<(module_root_dir)/native-util/',
					'files': ['<(module_root_dir)/build/Release/nbind.node'],
				},
			],
    },
  ],
  "includes": [
		"auto-top.gypi"
  ]
}