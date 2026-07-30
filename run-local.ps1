$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
$ActionPython = "C:\Users\ADMIN\anaconda3\envs\action\python.exe"
if (-not (Test-Path -LiteralPath $ActionPython)) {
    throw "Không tìm thấy Python của env action tại: $ActionPython"
}
Write-Host "Runtime log: $PSScriptRoot\logs\vlearn-runtime.log"
Write-Host "Live tail: Get-Content '$PSScriptRoot\logs\vlearn-runtime.log' -Wait -Tail 100"
Write-Host "Python env: $ActionPython"
& $ActionPython .\server.py
