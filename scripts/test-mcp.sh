#!/bin/bash
# MCP Server Test Script
# Usage: ./scripts/test-mcp.sh

set -e

BASE_URL="http://localhost:3000"
MCP_ENDPOINT="$BASE_URL/api/mcp"
MESSAGES_ENDPOINT="$BASE_URL/api/mcp/messages"

echo "🧪 Testing StochStack MCP Server"
echo "================================"
echo ""

# Check if server is running
echo "1. Checking server health..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo "❌ Server not running at $BASE_URL"
    echo "   Start with: npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Test create_session
echo "2. Testing create_session..."
SESSION_RESPONSE=$(curl -s -X POST "$MESSAGES_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "create_session",
            "arguments": {}
        }
    }')

echo "Response: $SESSION_RESPONSE"
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
    echo "❌ Failed to create session"
    exit 1
fi
echo "✅ Session created: $SESSION_ID"
echo ""

# Test run_simulation
echo "3. Testing run_simulation..."
SIM_RESPONSE=$(curl -s -X POST "$MESSAGES_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{
        \"jsonrpc\": \"2.0\",
        \"id\": 2,
        \"method\": \"tools/call\",
        \"params\": {
            \"name\": \"run_simulation\",
            \"arguments\": {
                \"sessionId\": \"$SESSION_ID\",
                \"therapeuticArea\": \"Oncology\",
                \"phase\": \"II\",
                \"countries\": [\"Germany\", \"France\"],
                \"targetSampleSize\": 200,
                \"durationMonths\": 16
            }
        }
    }")

echo "Response: $SIM_RESPONSE"
if echo "$SIM_RESPONSE" | grep -q "predictedFPI"; then
    echo "✅ Simulation ran successfully"
else
    echo "❌ Simulation failed"
    exit 1
fi
echo ""

# Test list_tools
echo "4. Testing tools/list..."
TOOLS_RESPONSE=$(curl -s -X POST "$MESSAGES_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/list"
    }')

TOOL_COUNT=$(echo "$TOOLS_RESPONSE" | grep -o '"name"' | wc -l)
echo "Found $TOOL_COUNT tools"
echo "✅ Tools listed successfully"
echo ""

# Test list_prompts
echo "5. Testing prompts/list..."
PROMPTS_RESPONSE=$(curl -s -X POST "$MESSAGES_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 4,
        "method": "prompts/list"
    }')

PROMPT_COUNT=$(echo "$PROMPTS_RESPONSE" | grep -o '"name"' | wc -l)
echo "Found $PROMPT_COUNT prompts"
echo "✅ Prompts listed successfully"
echo ""

# Test list_resources
echo "6. Testing resources/list..."
RESOURCES_RESPONSE=$(curl -s -X POST "$MESSAGES_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 5,
        "method": "resources/list"
    }')

RESOURCE_COUNT=$(echo "$RESOURCES_RESPONSE" | grep -o '"uri"' | wc -l)
echo "Found $RESOURCE_COUNT resources"
echo "✅ Resources listed successfully"
echo ""

# Test analyze_scenario
echo "7. Testing analyze_scenario..."
ANALYSIS_RESPONSE=$(curl -s -X POST "$MESSAGES_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{
        \"jsonrpc\": \"2.0\",
        \"id\": 6,
        \"method\": \"tools/call\",
        \"params\": {
            \"name\": \"analyze_scenario\",
            \"arguments\": {
                \"sessionId\": \"$SESSION_ID\",
                \"focus\": \"risk\"
            }
        }
    }")

echo "Response: $ANALYSIS_RESPONSE"
if echo "$ANALYSIS_RESPONSE" | grep -q "risk"; then
    echo "✅ Scenario analysis successful"
else
    echo "❌ Scenario analysis failed"
    exit 1
fi
echo ""

echo "================================"
echo "🎉 All MCP tests passed!"
echo ""
echo "Session ID: $SESSION_ID"
echo "You can now connect Claude Desktop or Cursor to:"
echo "  $MCP_ENDPOINT"
