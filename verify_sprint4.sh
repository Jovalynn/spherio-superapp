#!/usr/bin/env bash

echo "===================================================="
echo "      NEXUS TEAMS - SPRINT 4 VERIFICATION"
echo "===================================================="

echo
echo "================ AI WORKSPACE ================"
find 'app/nexus/meetings/[meetingCode]/v2/modules/workspace/ai' \
  -maxdepth 2 -type f 2>/dev/null | sort

echo
echo "================ MEETING RUNTIME ================"
find lib/riomind/meetings/intelligence-agents \
  -maxdepth 2 -type f 2>/dev/null | sort

echo
echo "================ TRANSLATION ================"
find lib -type f | grep -Ei 'translation|translate' || true

echo
echo "================ STT / SPEECH ================"
find lib -type f | grep -Ei 'speech|stt' || true

echo
echo "================ VOICE / TTS ================"
find lib -type f | grep -Ei 'tts|voice' || true

echo
echo "================ MEMORY ================"
find lib -type f | grep -Ei 'memory' || true

echo
echo "================ KNOWLEDGE GRAPH ================"
find lib -type f | grep -Ei 'graph' || true

echo
echo "================ API ================"
find app/api -type f | grep -Ei 'meeting|intelligence|agent|translate' || true

echo
echo "================ DATABASE ================"
find prisma -type f 2>/dev/null || true
echo
find db -type f 2>/dev/null || true

echo
echo "================ RIOMIND ================"
find lib/riomind -maxdepth 2 -type d | sort

echo
echo "================ END OF REPORT ================"
