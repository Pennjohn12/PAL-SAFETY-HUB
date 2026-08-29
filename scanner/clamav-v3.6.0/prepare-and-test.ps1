[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Destination
)

$ErrorActionPreference = 'Stop'
$upstream = 'https://github.com/GoogleCloudPlatform/docker-clamav-malware-scanner.git'
$expectedCommit = '0db019c9f09494215aa4485b71094e9b8d5ea90b'
$patchPath = Join-Path $PSScriptRoot 'pal-hardening.patch'

function Invoke-PalNpm {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        & npm @Arguments
    }
    elseif (Get-Command pnpm -ErrorAction SilentlyContinue) {
        & pnpm dlx npm@11.6.0 @Arguments
    }
    else {
        throw 'npm 11 or pnpm is required to prepare and test the scanner candidate.'
    }
    if ($LASTEXITCODE -ne 0) {
        throw "npm command failed with exit code $LASTEXITCODE"
    }
}

if (Test-Path -LiteralPath $Destination) {
    throw "Destination already exists: $Destination"
}

git clone --no-checkout $upstream $Destination
git -C $Destination checkout --detach $expectedCommit
$actualCommit = (git -C $Destination rev-parse HEAD).Trim()
if ($actualCommit -ne $expectedCommit) {
    throw "Upstream revision mismatch: expected $expectedCommit, received $actualCommit"
}

git -C $Destination apply --check $patchPath
git -C $Destination apply $patchPath

$scannerPath = Join-Path $Destination 'cloudrun-malware-scanner'
$reporterPath = Join-Path $scannerPath 'pal-rescan-reporter.ts'
$reporterSpecPath = Join-Path $scannerPath 'spec\pal-rescan-reporter.spec.ts'
if (-not (Test-Path -LiteralPath $reporterPath) -or -not (Test-Path -LiteralPath $reporterSpecPath)) {
    throw 'The hardened scanner patch is missing the PAL rescan reporter or its test.'
}
Push-Location $scannerPath
try {
    $bashCommand = Get-Command bash -ErrorAction SilentlyContinue
    $bashPath = if ($bashCommand) { $bashCommand.Source } else { $null }
    if (-not $bashPath) {
        $gitBash = Join-Path $env:ProgramFiles 'Git\bin\bash.exe'
        if (Test-Path -LiteralPath $gitBash) {
            $bashPath = $gitBash
        }
    }
    if (-not $bashPath) {
        throw 'bash is required to validate the scanner startup script.'
    }
    & $bashPath -n bootstrap.sh
    if ($LASTEXITCODE -ne 0) {
        throw 'Scanner startup script syntax validation failed.'
    }
    if (Select-String -Path bootstrap.sh -Pattern '\bnpm\b' -Quiet) {
        throw 'Scanner startup script still requires npm after npm was removed from the runtime image.'
    }
    Invoke-PalNpm ci --ignore-scripts
    Invoke-PalNpm audit --omit=dev
    Invoke-PalNpm run build
    $env:NODE_ENV = 'test'
    $env:NODE_OPTIONS = '--enable-source-maps'
    node node_modules/jasmine/bin/jasmine.js
}
finally {
    Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
    Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
    Pop-Location
}

Write-Host "PAL scanner candidate prepared and tested at $Destination"
