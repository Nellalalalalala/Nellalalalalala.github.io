#requires -Version 5.1
[CmdletBinding()]
param(
    [ValidateSet('Install', 'Restore', 'Verify', 'CheckPackage')]
    [string]$Action = 'Install',
    [string]$GamePath,
    [string]$PackageRoot = $PSScriptRoot,
    [switch]$NoGui
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

function Get-Sha256([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Join-SafePath([string]$Root, [string]$Relative) {
    if ([string]::IsNullOrWhiteSpace($Relative) -or
        $Relative -match '(^|[/\\])\.\.([/\\]|$)' -or
        $Relative -match '[:\x00]' -or [IO.Path]::IsPathRooted($Relative)) {
        throw "Недопустимый путь в пакете: $Relative"
    }
    $base = [IO.Path]::GetFullPath($Root).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    $full = [IO.Path]::GetFullPath([IO.Path]::Combine($base, $Relative.Replace('/', [IO.Path]::DirectorySeparatorChar)))
    if (-not $full.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Путь выходит за пределы папки: $Relative"
    }
    return $full
}

function Find-Game {
    $roots = New-Object 'System.Collections.Generic.List[string]'
    foreach ($reg in @('HKCU:\Software\Valve\Steam', 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam', 'HKLM:\SOFTWARE\Valve\Steam')) {
        $properties = Get-ItemProperty -LiteralPath $reg -ErrorAction SilentlyContinue
        if ($null -eq $properties) { continue }
        foreach ($name in @('SteamPath', 'InstallPath')) {
            $property = $properties.PSObject.Properties[$name]
            if ($null -ne $property -and $property.Value) { $roots.Add([string]$property.Value) }
        }
    }
    if (${env:ProgramFiles(x86)}) { $roots.Add((Join-Path ${env:ProgramFiles(x86)} 'Steam')) }
    foreach ($root in @($roots.ToArray())) {
        $vdf = Join-Path $root 'steamapps\libraryfolders.vdf'
        if (-not [IO.File]::Exists($vdf)) { continue }
        $text = [IO.File]::ReadAllText($vdf)
        foreach ($match in [regex]::Matches($text, '(?im)^\s*"path"\s+"((?:\\.|[^"\\])*)"')) {
            $roots.Add($match.Groups[1].Value.Replace('\\', '\'))
        }
    }
    foreach ($root in @($roots.ToArray() | Select-Object -Unique)) {
        $candidate = Join-Path $root 'steamapps\common\Garage Bad Dream Adventure'
        if ([IO.File]::Exists((Join-Path $candidate 'Garage.exe'))) { return $candidate }
    }
    if ($NoGui) { throw 'Папка игры не найдена. Укажите -GamePath.' }
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Выберите папку Garage Bad Dream Adventure, в которой находится Garage.exe'
    $dialog.ShowNewFolderButton = $false
    try {
        if ($dialog.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) { throw 'Выбор папки отменён. Файлы не изменены.' }
        return $dialog.SelectedPath
    } finally { $dialog.Dispose() }
}

function Write-AtomicFile([string]$Source, [string]$Destination) {
    $directory = [IO.Path]::GetDirectoryName($Destination)
    [void][IO.Directory]::CreateDirectory($directory)
    $temporary = Join-Path $directory ('.garage-ru-' + [Guid]::NewGuid().ToString('N') + '.tmp')
    try {
        [IO.File]::Copy($Source, $temporary, $false)
        # Both files are on the same volume; Replace leaves no half-written asset.
        [IO.File]::Replace($temporary, $Destination, $null)
    } finally {
        if ([IO.File]::Exists($temporary)) { [IO.File]::Delete($temporary) }
    }
}

try {
    $PackageRoot = [IO.Path]::GetFullPath($PackageRoot)
    $manifestPath = Join-Path $PackageRoot 'manifest.json'
    $manifest = [IO.File]::ReadAllText($manifestPath, [Text.Encoding]::UTF8) | ConvertFrom-Json
    if ($manifest.format_version -ne 1) { throw 'Неизвестный формат пакета.' }
    $files = @($manifest.files)
    if ($files.Count -eq 0) { throw 'В пакете нет файлов перевода.' }
    $payloadRoot = Join-Path $PackageRoot 'payload'
    $seen = @{}
    foreach ($item in $files) {
        if (-not $item.file.StartsWith('Garage_Data/', [StringComparison]::Ordinal)) {
            throw "Пакет может менять только ресурсы Garage_Data: $($item.file)"
        }
        if ($seen.ContainsKey($item.file.ToLowerInvariant())) { throw "Повтор пути в пакете: $($item.file)" }
        $seen[$item.file.ToLowerInvariant()] = $true
        $source = Join-SafePath $payloadRoot $item.file
        if (-not [IO.File]::Exists($source) -or (Get-Sha256 $source) -ne $item.patched_sha256) {
            throw "Архив повреждён: $($item.file). Распакуйте его заново."
        }
    }
    if ($Action -eq 'CheckPackage') {
        Write-Host "Пакет проверен: $($files.Count) файлов, версия $($manifest.version)."
        exit 0
    }
    if ([string]::IsNullOrWhiteSpace($GamePath)) { $GamePath = Find-Game }
    $GamePath = [IO.Path]::GetFullPath($GamePath)
    if (-not [IO.File]::Exists((Join-Path $GamePath 'Garage.exe'))) {
        throw 'Выберите папку с Garage.exe, а не папку Garage_Data.'
    }
    if ($GamePath.Equals($PackageRoot, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Сначала распакуйте архив в отдельную папку, вне папки игры.'
    }
    foreach ($guard in @($manifest.guards)) {
        $path = Join-SafePath $GamePath $guard.file
        if (-not [IO.File]::Exists($path) -or (Get-Sha256 $path) -ne $guard.sha256) {
            throw "Версия игры не совпадает с пакетом (Steam build $($manifest.steam_build)). Проверка: $($guard.file). Файлы не изменены."
        }
    }
    foreach ($process in @(Get-Process -Name 'Garage' -ErrorAction SilentlyContinue)) {
        try { $runningPath = $process.Path } catch { throw 'Закройте Garage перед установкой или возвратом оригинала.' }
        if ($runningPath -and [IO.Path]::GetDirectoryName($runningPath).Equals($GamePath, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Закройте Garage перед установкой или возвратом оригинала.'
        }
    }
    $backupRoot = Join-Path $GamePath ('Garage_RU_Backup\' + $manifest.steam_build)
    $plan = New-Object 'System.Collections.Generic.List[object]'
    $originalCount = 0
    $patchedCount = 0
    # Finish every compatibility check before writing a backup or game file.
    foreach ($item in $files) {
        $destination = Join-SafePath $GamePath $item.file
        if (-not [IO.File]::Exists($destination)) { throw "В игре отсутствует $($item.file). Проверьте файлы игры через Steam." }
        $actual = Get-Sha256 $destination
        if ($actual -eq $item.original_sha256) { $originalCount++ }
        elseif ($actual -eq $item.patched_sha256) { $patchedCount++ }
        else { throw "Другая версия или сторонние изменения: $($item.file). Ни один файл игры не изменён." }
        $backup = Join-SafePath $backupRoot $item.file
        if ([IO.File]::Exists($backup) -and (Get-Sha256 $backup) -ne $item.original_sha256) {
            throw "Резервная копия повреждена: $backup"
        }
        if ($Action -ne 'Verify' -and $actual -eq $item.patched_sha256 -and -not [IO.File]::Exists($backup)) {
            throw 'Перевод уже есть, но резервной копии оригинала нет. Сначала восстановите игру проверкой файлов Steam и повторите установку.'
        }
        $plan.Add([pscustomobject]@{ Item=$item; Destination=$destination; Backup=$backup; Actual=$actual })
    }
    if ($Action -eq 'Verify') {
        if ($patchedCount -eq $files.Count) { Write-Host 'Русский перевод установлен и проверен.'; exit 0 }
        if ($originalCount -eq $files.Count) { Write-Host 'Установлены оригинальные файлы игры.'; exit 0 }
        throw 'Установка неполная. Запустите Install.cmd или Restore.cmd, чтобы завершить операцию.'
    }
    if ($Action -eq 'Install') {
        foreach ($step in $plan) {
            if ($step.Actual -ne $step.Item.original_sha256 -or [IO.File]::Exists($step.Backup)) { continue }
            [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($step.Backup))
            [IO.File]::Copy($step.Destination, $step.Backup, $false)
            if ((Get-Sha256 $step.Backup) -ne $step.Item.original_sha256) { throw 'Не удалось проверить резервную копию. Игра не изменена.' }
        }
    }
    $changed = New-Object 'System.Collections.Generic.List[object]'
    try {
        foreach ($step in $plan) {
            $desired = $step.Item.patched_sha256
            $source = Join-SafePath $payloadRoot $step.Item.file
            if ($Action -eq 'Restore') { $desired=$step.Item.original_sha256; $source=$step.Backup }
            if ($step.Actual -eq $desired) { continue }
            $changed.Add($step)
            Write-AtomicFile $source $step.Destination
            if ((Get-Sha256 $step.Destination) -ne $desired) { throw "Ошибка проверки: $($step.Item.file)" }
        }
    } catch {
        $failure = $_.Exception.Message
        $rollbackErrors = New-Object 'System.Collections.Generic.List[string]'
        for ($i=$changed.Count-1; $i -ge 0; $i--) {
            $step=$changed[$i]
            try {
                if ((Get-Sha256 $step.Destination) -eq $step.Actual) { continue }
                $previousSource=$step.Backup
                if ($step.Actual -eq $step.Item.patched_sha256) { $previousSource=Join-SafePath $payloadRoot $step.Item.file }
                Write-AtomicFile $previousSource $step.Destination
                if ((Get-Sha256 $step.Destination) -ne $step.Actual) { throw 'Не совпала контрольная сумма.' }
            } catch { $rollbackErrors.Add($step.Item.file) }
        }
        if ($rollbackErrors.Count) {
            throw "$failure Не удалось завершить откат: $($rollbackErrors -join ', '). Оригиналы: $backupRoot"
        }
        throw "$failure Изменения этой операции отменены. Закройте игру и повторите установку."
    }
    if ($Action -eq 'Install') {
        Write-Host 'Русский перевод установлен. Запустите игру через Steam и выберите язык «Русский».'
        Write-Host "Оригиналы сохранены: $backupRoot"
    } else { Write-Host 'Оригинальные файлы восстановлены. Сохранения игры не изменялись.' }
    exit 0
} catch {
    Write-Host ('Ошибка: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
