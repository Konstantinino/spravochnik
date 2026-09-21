; Preserve desktop/start menu shortcuts during in-place upgrades.
; Without this, NSIS may delete and recreate the desktop .lnk, which breaks
; a Windows taskbar pin tied to that shortcut.
!macro customInit
  WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" KeepShortcuts "true"
!macroend
