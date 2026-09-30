<#
.SYNOPSIS
Installs GeminiPostCutoff as an Antigravity Plugin or creates direct skill symlinks.

.PARAMETER AsPlugin
Installs into ~/.gemini/config/plugins/GeminiPostCutoff (Recommended).

.PARAMETER FlatSkills
Symlinks each skill directly into ~/.gemini/config/skills/<skill-name>.
#>
param (
    [switch]$FlatSkills
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$homeDir = [Environment]::GetFolderPath("UserProfile")

if (-not $FlatSkills) {
    # Default: Native Plugin Installation
    $pluginTarget = Join-Path $homeDir ".gemini\config\plugins\GeminiPostCutoff"
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
    Write-Host "Restart Antigravity or Gemini CLI to activate all 21 domain skills." -ForegroundColor White
} else {
    # Alternative: Direct Skill Symlinks
    $skillsTargetDir = Join-Path $homeDir ".gemini\config\skills"
    Write-Host "Symlinking skills directly to $skillsTargetDir..." -ForegroundColor Cyan
    if (-not (Test-Path $skillsTargetDir)) { New-Item -ItemType Directory -Path $skillsTargetDir -Force | Out-Null }
    
    $skills = Get-ChildItem -Path (Join-Path $repoRoot "skills") -Directory
    foreach ($s in $skills) {
        $dest = Join-Path $skillsTargetDir $s.Name
        if (Test-Path $dest) {
            Write-Host "  Skipping existing: $($s.Name)" -ForegroundColor DarkGray
        } else {
            New-Item -ItemType SymbolicLink -Path $dest -Target $s.FullName | Out-Null
            Write-Host "  ✓ Linked $($s.Name)" -ForegroundColor Green
        }
    }
    Write-Host "✓ All skills linked directly!" -ForegroundColor Green
}
