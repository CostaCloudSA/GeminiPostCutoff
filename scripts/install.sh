#!/usr/bin/env bash
set -euo pipefail

# Installs GeminiPostCutoff as an Antigravity Plugin or flat skill symlinks.
FLAT_SKILLS=false
for arg in "$@"; do
  if [ "$arg" == "--flat-skills" ]; then
    FLAT_SKILLS=true
  fi
done

HOME_DIR="${HOME:-$USERPROFILE}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$FLAT_SKILLS" = false ]; then
  PLUGIN_TARGET="$HOME_DIR/.gemini/config/plugins/GeminiPostCutoff"
  echo "Installing GeminiPostCutoff as an Antigravity Plugin..."
  if [ -d "$PLUGIN_TARGET" ]; then
    echo "Plugin directory already exists. Pulling latest updates..."
    git -C "$PLUGIN_TARGET" pull
  else
    mkdir -p "$(dirname "$PLUGIN_TARGET")"
    git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git "$PLUGIN_TARGET"
  fi
  echo "✓ Installed successfully as Antigravity Plugin!"
  echo "Restart Antigravity or Gemini CLI to activate all 21 domain skills."
else
  SKILLS_TARGET="$HOME_DIR/.gemini/config/skills"
  mkdir -p "$SKILLS_TARGET"
  echo "Symlinking skills directly to $SKILLS_TARGET..."
  for skill_dir in "$REPO_ROOT/skills"/*; do
    if [ -d "$skill_dir" ]; then
      skill_name="$(basename "$skill_dir")"
      dest="$SKILLS_TARGET/$skill_name"
      if [ -e "$dest" ]; then
        echo "  Skipping existing: $skill_name"
      else
        ln -s "$skill_dir" "$dest"
        echo "  ✓ Linked $skill_name"
      fi
    fi
  done
  echo "✓ All skills linked directly!"
fi
