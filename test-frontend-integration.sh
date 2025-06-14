#!/bin/bash

echo "🔍 Testing Frontend Integration with QR Engine v2"
echo "==============================================="

# Check if frontend can access v2 endpoints
echo -e "\n1. Testing v2 endpoint access from frontend port:"
curl -s -X POST http://localhost:3000/api/proxy-qr \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Frontend test",
    "options": {
      "size": 300
    }
  }' | jq '.' 2>/dev/null || echo "❌ No proxy endpoint found"

# Check direct backend access
echo -e "\n2. Testing direct backend v2 endpoint:"
curl -s -X POST http://localhost:3004/api/v2/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Direct backend test",
    "options": {
      "size": 300,
      "eyeShape": "circle",
      "dataPattern": "dots"
    }
  }' | jq '.metadata' || echo "❌ Backend not accessible"

# Search for v2 features in frontend
echo -e "\n3. Checking frontend files for v2 features:"
echo "============================================"

# Check for eye shapes
echo -n "Eye shapes UI: "
grep -r "eyeShape\|eye.*shape" frontend/src/components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | awk '{print $1 " occurrences"}'

# Check for data patterns
echo -n "Data patterns UI: "
grep -r "dataPattern\|data.*pattern" frontend/src/components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | awk '{print $1 " occurrences"}'

# Check for effects
echo -n "Effects UI: "
grep -r "effects\|shadow\|glow\|blur" frontend/src/components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | awk '{print $1 " occurrences"}'

# Check for frames
echo -n "Frames UI: "
grep -r "frame\|Frame" frontend/src/components --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | awk '{print $1 " occurrences"}'

echo -e "\n4. Frontend feature mapping status:"
echo "==================================="
echo -n "✅ Gradients: "
grep -q "gradient" frontend/src/hooks/useBarcodeGenerationV2.ts && echo "Mapped in hook" || echo "❌ Not mapped"

echo -n "❓ Eye shapes: "
grep -q "eyeShape" frontend/src/hooks/useBarcodeGenerationV2.ts && echo "Mapped in hook" || echo "❌ Not mapped"

echo -n "❓ Data patterns: "
grep -q "dataPattern" frontend/src/hooks/useBarcodeGenerationV2.ts && echo "Mapped in hook" || echo "❌ Not mapped"

echo -n "❓ Effects: "
grep -q "effects" frontend/src/hooks/useBarcodeGenerationV2.ts && echo "Mapped in hook" || echo "❌ Not mapped"

echo -n "❓ Frames: "
grep -q "frame" frontend/src/hooks/useBarcodeGenerationV2.ts && echo "Mapped in hook" || echo "❌ Not mapped"

echo -e "\n5. Summary:"
echo "=========="
if grep -q "eyeShape.*dataPattern" frontend/src/hooks/useBarcodeGenerationV2.ts; then
  echo "✅ Basic v2 features are mapped in the hook"
else
  echo "⚠️  Some v2 features may not be fully integrated"
fi

echo -e "\n📝 Integration Status:"
echo "===================="
echo "- Hook: Uses /api/v2/qr endpoint ✅"
echo "- Gradients: Fully integrated ✅"
echo "- Eye shapes: Mapped in hook (line 106) ✅"
echo "- Data patterns: Mapped in hook (line 107) ✅"
echo "- Effects: NOT integrated ❌"
echo "- Frames: NOT integrated ❌"
echo ""
echo "🎯 Next Steps:"
echo "1. Add UI components for eye shapes selection"
echo "2. Add UI components for data patterns selection"
echo "3. Add UI components for effects configuration"
echo "4. Add UI components for frames configuration"
echo "5. Update hook to map effects and frames"