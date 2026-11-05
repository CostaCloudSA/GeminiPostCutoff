<#
.SYNOPSIS
Installs GeminiPostCutoff as an Antigravity Plugin, syncs flat skill symlinks, and promotes global rules (AGENTS.md & GEMINI.md).

.PARAMETER FlatSkills
Symlinks each skill directly into ~/.gemini/config/skills/<skill-name>.

.PARAMETER SyncRules
Promotes rules/AGENTS.md and skills/gcp-skills-index/INGESTION_PROTOCOL.md to ~/.gemini/config/AGENTS.md and ~/.gemini/config/GEMINI.md.

.PARAMETER Force
Re-links or overwrites existing skill entries in ~/.gemini/config/skills/.
#>
param (
    [switch]$FlatSkills,
    [switch]$SyncRules,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$homeDir = [Environment]::GetFolderPath("UserProfile")
$configDir = Join-Path $homeDir ".gemini\config"

if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

if ($SyncRules) {
    Write-Host "Synchronizing Global Production Rules in $configDir..." -ForegroundColor Cyan
    Copy-Item -Path (Join-Path $repoRoot "rules\AGENTS.md") -Destination (Join-Path $configDir "AGENTS.md") -Force
    Copy-Item -Path (Join-Path $repoRoot "skills\gcp-skills-index\INGESTION_PROTOCOL.md") -Destination (Join-Path $configDir "GEMINI.md") -Force
    Write-Host "  ✓ Promoted rules/AGENTS.md -> ~/.gemini/config/AGENTS.md" -ForegroundColor Green
    Write-Host "  ✓ Promoted INGESTION_PROTOCOL.md -> ~/.gemini/config/GEMINI.md" -ForegroundColor Green
}

if (-not $FlatSkills) {
    # Default: Native Plugin Installation
    $pluginTarget = Join-Path $configDir "plugins\GeminiPostCutoff"
    Write-Host "Installing GeminiPostCutoff as an Antigravity Plugin..." -ForegroundColor Cyan
    
    if (Test-Path $pluginTarget) {
        Write-Host "Plugin directory already exists at: $pluginTarget" -ForegroundColor Yellow
        Write-Host "Updating git repository..." -ForegroundColor Cyan
        git -C $pluginTarget pull
    } else {
        $parentDir = Split-Path -Parent $pluginTarget
        if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
        Write-Host "Cloning into $pluginTarget..." -ForegroundColor Cyan
        git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git $pluginTarget
    }
    
    Write-Host "✓ Installed successfully as Antigravity Plugin!" -ForegroundColor Green
    Write-Host "Restart Antigravity or Gemini CLI to activate all 22 domain skills (plus Master Router)." -ForegroundColor White
} else {
    # Alternative: Direct Skill Symlinks / Sync
    $skillsTargetDir = Join-Path $configDir "skills"
    Write-Host "Synchronizing skills to $skillsTargetDir..." -ForegroundColor Cyan
    if (-not (Test-Path $skillsTargetDir)) { New-Item -ItemType Directory -Path $skillsTargetDir -Force | Out-Null }
    
    $skills = Get-ChildItem -Path (Join-Path $repoRoot "skills") -Directory
    foreach ($s in $skills) {
        $dest = Join-Path $skillsTargetDir $s.Name
        if (Test-Path $dest) {
            if ($Force) {
                Copy-Item -Path (Join-Path $s.FullName "*") -Destination $dest -Recurse -Force
                Write-Host "  ✓ Synced $($s.Name)" -ForegroundColor Green
            } else {
                Write-Host "  Skipping existing: $($s.Name) (use -Force to overwrite)" -ForegroundColor DarkGray
            }
        } else {
            New-Item -ItemType SymbolicLink -Path $dest -Target $s.FullName | Out-Null
            Write-Host "  ✓ Linked $($s.Name)" -ForegroundColor Green
        }
    }
    Write-Host "✓ All skills synchronized!" -ForegroundColor Green
}
