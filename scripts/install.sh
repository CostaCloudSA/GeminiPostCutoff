#!/usr/bin/env bash
set -euo pipefail

# Installs GeminiPostCutoff as an Antigravity Plugin, flat skill symlinks, and syncs global rules.
FLAT_SKILLS=false
SYNC_RULES=false
FORCE=false

for arg in "$@"; do
  if [ "$arg" == "--flat-skills" ]; then
    FLAT_SKILLS=true
  elif [ "$arg" == "--sync-rules" ]; then
    SYNC_RULES=true
  elif [ "$arg" == "--force" ]; then
    FORCE=true
  fi
done

HOME_DIR="${HOME:-$USERPROFILE}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_DIR="$HOME_DIR/.gemini/config"
mkdir -p "$CONFIG_DIR"

if [ "$SYNC_RULES" = true ]; then
  echo "Synchronizing Global Production Rules in $CONFIG_DIR..."
  cp -f "$REPO_ROOT/rules/AGENTS.md" "$CONFIG_DIR/AGENTS.md"
  cp -f "$REPO_ROOT/skills/gcp-skills-index/INGESTION_PROTOCOL.md" "$CONFIG_DIR/GEMINI.md"
  echo "  ✓ Promoted rules/AGENTS.md -> ~/.gemini/config/AGENTS.md"
  echo "  ✓ Promoted INGESTION_PROTOCOL.md -> ~/.gemini/config/GEMINI.md"
fi

if [ "$FLAT_SKILLS" = false ]; then
  PLUGIN_TARGET="$CONFIG_DIR/plugins/GeminiPostCutoff"
  echo "Installing GeminiPostCutoff as an Antigravity Plugin..."
  if [ -d "$PLUGIN_TARGET" ]; then
    echo "Plugin directory already exists. Pulling latest updates..."
    git -C "$PLUGIN_TARGET" pull
  else
    mkdir -p "$(dirname "$PLUGIN_TARGET")"
    git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git "$PLUGIN_TARGET"
  fi
  echo "✓ Installed successfully as Antigravity Plugin!"
  echo "Restart Antigravity or Gemini CLI to activate all 22 domain skills (plus Master Router)."
else
  SKILLS_TARGET="$CONFIG_DIR/skills"
  mkdir -p "$SKILLS_TARGET"
  echo "Synchronizing skills to $SKILLS_TARGET..."
  for skill_dir in "$REPO_ROOT/skills"/*; do
    if [ -d "$skill_dir" ]; then
      skill_name="$(basename "$skill_dir")"
      dest="$SKILLS_TARGET/$skill_name"
      if [ -e "$dest" ]; then
        if [ "$FORCE" = true ]; then
          cp -Rf "$skill_dir/"* "$dest/"
          echo "  ✓ Synced $skill_name"
        else
          echo "  Skipping existing: $skill_name (use --force to overwrite)"
        fi
      else
        ln -s "$skill_dir" "$dest"
        echo "  ✓ Linked $skill_name"
      fi
    fi
  done
  echo "✓ All skills synchronized!"
fi
