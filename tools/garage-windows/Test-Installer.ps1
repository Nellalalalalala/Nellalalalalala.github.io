#requires -Version 5.1
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$installer=Join-Path $PSScriptRoot 'Installer.ps1'
$temp=Join-Path ([IO.Path]::GetTempPath()) ('Garage RU tests [] ' + [Guid]::NewGuid().ToString('N'))
$package=Join-Path $temp 'Пакет перевода []'
$game=Join-Path $temp 'Библиотека Steam []\Garage Bad Dream Adventure'
$null=[IO.Directory]::CreateDirectory($package)
$null=[IO.Directory]::CreateDirectory($game)
$encoding=New-Object Text.UTF8Encoding($true)
$files=@('Garage_Data/level2','Garage_Data/sharedassets5.assets','Garage_Data/il2cpp_data/Metadata/global-metadata.dat')
$originals=@{}
$patched=@{}
function Hash([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Write-Text([string]$Path,[string]$Text) {
    $null=[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Path))
    [IO.File]::WriteAllText($Path,$Text,$encoding)
}
function Assert([bool]$Condition,[string]$Message) { if (-not $Condition) { throw $Message } }
function Invoke-Installer([string]$Action,[int]$Expected=0,[string]$Root=$package) {
    & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installer -Action $Action -PackageRoot $Root -GamePath $game -NoGui
    if ($LASTEXITCODE -ne $Expected) { throw "Unexpected exit code $LASTEXITCODE, expected $Expected, action $Action" }
}
function Assert-State([string]$State) {
    foreach ($file in $files) {
        $expected=$originals[$file]
        if ($State -eq 'patched') { $expected=$patched[$file] }
        Assert ((Hash (Join-Path $game $file)) -eq $expected) "Unexpected state of $file ($State)"
    }
    Assert (([IO.File]::ReadAllText((Join-Path $game 'save-data-never-touch.dat'))) -eq 'USER SAVE') 'User save was changed'
}
try {
    $entries=@()
    $i=0
    foreach ($file in $files) {
        $original=Join-Path $game $file
        $payload=Join-Path (Join-Path $package 'payload') $file
        Write-Text $original ('Original '+$i)
        Write-Text $payload ('Русский перевод '+$i)
        $originals[$file]=Hash $original
        $patched[$file]=Hash $payload
        $entries+=@{file=$file;original_sha256=$originals[$file];patched_sha256=$patched[$file]}
        $i++
    }
    Write-Text (Join-Path $game 'Garage.exe') 'NATIVE WINDOWS FIXTURE'
    Write-Text (Join-Path $game 'save-data-never-touch.dat') 'USER SAVE'
    $manifest=@{format_version=1;version='test';steam_build='test-build';guards=@(@{file='Garage.exe';sha256=(Hash (Join-Path $game 'Garage.exe'))});files=$entries}
    $manifestPath=Join-Path $package 'manifest.json'
    $json=$manifest | ConvertTo-Json -Depth 10
    Write-Text $manifestPath $json
    Invoke-Installer CheckPackage
    Invoke-Installer Verify
    Invoke-Installer Install
    Assert-State patched
    Invoke-Installer Install
    Invoke-Installer Verify
    foreach ($file in $files) {
        Assert ((Hash (Join-Path (Join-Path $game 'Garage_RU_Backup\test-build') $file)) -eq $originals[$file]) 'Original backup does not match'
    }
    Invoke-Installer Restore
    Assert-State original
    Invoke-Installer Restore
    Write-Host 'PASS: install, repeat install, verify, restore, repeat restore; Unicode/spaces/brackets'

    # An incompatible file at the END of the plan must prevent every write.
    $last=Join-Path $game $files[-1]
    $saved=[IO.File]::ReadAllBytes($last)
    Write-Text $last 'UNKNOWN GAME VERSION'
    Invoke-Installer Install 1
    Assert ((Hash (Join-Path $game $files[0])) -eq $originals[$files[0]]) 'Preflight was not atomic'
    [IO.File]::WriteAllBytes($last,$saved)
    Assert-State original
    Write-Host 'PASS: incompatible game aborts before any changes'

    $lastPayload=Join-Path (Join-Path $package 'payload') $files[-1]
    $saved=[IO.File]::ReadAllBytes($lastPayload)
    Write-Text $lastPayload 'DAMAGED DOWNLOAD'
    Invoke-Installer Install 1
    Assert-State original
    [IO.File]::WriteAllBytes($lastPayload,$saved)
    Write-Host 'PASS: corrupt payload is rejected'

    # Hold the second target open without delete-sharing: first file changes,
    # second atomic Replace fails, then the first must roll back to original.
    $lock=[IO.File]::Open((Join-Path $game $files[1]),[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read)
    try { Invoke-Installer Install 1 } finally { $lock.Dispose() }
    Assert-State original
    Write-Host 'PASS: locked-file installation failure rolls back earlier changes'

    Invoke-Installer Install
    $lock=[IO.File]::Open((Join-Path $game $files[1]),[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read)
    try { Invoke-Installer Restore 1 } finally { $lock.Dispose() }
    Assert-State patched
    Invoke-Installer Restore
    Assert-State original
    Write-Host 'PASS: locked-file restore failure returns to prior translated state'

    # Validate the real double-click entry point, not only -File invocation.
    foreach ($cmd in @('Install.cmd','Restore.cmd')) { [IO.File]::Copy((Join-Path $PSScriptRoot $cmd),(Join-Path $package $cmd)) }
    [IO.File]::Copy($installer,(Join-Path $package 'Installer.ps1'))
    $env:GARAGE_RU_NO_PAUSE='1'
    $start=New-Object Diagnostics.ProcessStartInfo
    $start.FileName=$env:ComSpec
    $start.UseShellExecute=$false
    $start.CreateNoWindow=$true
    $start.Arguments='/d /s /c ""'+(Join-Path $package 'Install.cmd')+'" -GamePath "'+$game+'" -NoGui"'
    $started=[Diagnostics.Process]::Start($start)
    $started.WaitForExit()
    Assert ($started.ExitCode -eq 0) 'Install.cmd failed'
    $started.Dispose()
    Assert-State patched
    $start.Arguments='/d /s /c ""'+(Join-Path $package 'Restore.cmd')+'" -GamePath "'+$game+'" -NoGui"'
    $started=[Diagnostics.Process]::Start($start)
    $started.WaitForExit()
    Assert ($started.ExitCode -eq 0) 'Restore.cmd failed'
    $started.Dispose()
    Assert-State original
    Write-Host 'PASS: .cmd entry points work from Cyrillic folders with spaces and brackets'

    # Untrusted manifest entries may not escape the resource directory.
    $bad=$manifest | ConvertTo-Json -Depth 10 | ConvertFrom-Json
    $bad.files[0].file='Garage_Data/../../outside.dat'
    Write-Text $manifestPath ($bad | ConvertTo-Json -Depth 10)
    Invoke-Installer CheckPackage 1
    Write-Text $manifestPath $json
    Write-Host 'PASS: traversal paths rejected'
    Write-Host "WINDOWS POWERSHELL $($PSVersionTable.PSVersion) TESTS PASSED"
    $global:LASTEXITCODE=0
} finally {
    if ([IO.Directory]::Exists($temp)) { [IO.Directory]::Delete($temp,$true) }
}
