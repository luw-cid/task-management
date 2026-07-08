#!/usr/bin/env bash
# Comprehensive API test for task-management backend
BASE="http://localhost:8080/api"
EMAIL="qa.automation@taskflow.test"
PASS="QaTest@2026"

PASSC=0
FAILC=0
FAILLOG=""

# helper: req METHOD PATH EXPECTED_STATUS [JSON_BODY] [AUTH]
req() {
  local method="$1" path="$2" expect="$3" body="$4" auth="$5"
  local args=(-s -o /tmp/resp.txt -w "%{http_code}" -X "$method" "$BASE$path" -H "Content-Type: application/json")
  if [ -n "$auth" ]; then args+=(-H "Authorization: Bearer $auth"); fi
  if [ -n "$body" ]; then args+=(-d "$body"); fi
  local code
  code=$(curl "${args[@]}")
  local resp
  resp=$(cat /tmp/resp.txt)
  if [ "$code" = "$expect" ]; then
    PASSC=$((PASSC+1))
    echo "PASS [$code] $method $path"
  else
    FAILC=$((FAILC+1))
    echo "FAIL [exp $expect got $code] $method $path"
    echo "     resp: ${resp:0:300}"
    FAILLOG="$FAILLOG\nFAIL [exp $expect got $code] $method $path :: ${resp:0:200}"
  fi
  LAST_RESP="$resp"
  LAST_CODE="$code"
}

jval() { echo "$1" | grep -o "\"$2\":[0-9]*" | head -1 | grep -o '[0-9]*'; }
jstr() { echo "$1" | sed -n "s/.*\"$2\":\"\([^\"]*\)\".*/\1/p" | head -1; }

echo "===== AUTH ====="
req POST /auth/login 200 "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
TOKEN=$(jstr "$LAST_RESP" accessToken)
REFRESH=$(jstr "$LAST_RESP" refreshToken)
echo "token len: ${#TOKEN}"

req POST /auth/login 401 "{\"email\":\"$EMAIL\",\"password\":\"wrongpass\"}"
req POST /auth/register 400 "{\"email\":\"$EMAIL\",\"password\":\"QaTest@2026\",\"fullName\":\"Dup\"}"
req POST /auth/register 400 "{\"email\":\"bad$RANDOM@x.test\",\"password\":\"12\",\"fullName\":\"X\"}"
req GET /boards 401 "" ""

echo "===== USER PROFILE ====="
req GET /users/me 200 "" "$TOKEN"
MYID=$(jval "$LAST_RESP" id)
echo "myid: $MYID"
req PUT /users/me 200 "{\"fullName\":\"QA Automation Updated\"}" "$TOKEN"
req GET /users/$MYID 200 "" "$TOKEN"

echo "===== BOARD ====="
req POST /boards 201 "{\"name\":\"QA Test Board\",\"description\":\"Board tao boi automation\"}" "$TOKEN"
BOARD=$(jval "$LAST_RESP" id)
echo "boardId: $BOARD"
req GET /boards 200 "" "$TOKEN"
req PUT /boards/$BOARD 200 "{\"name\":\"QA Board Renamed\",\"description\":\"updated\"}" "$TOKEN"
req POST /boards 400 "{\"name\":\"X\"}" "$TOKEN"
req GET /boards/$BOARD/members 200 "" "$TOKEN"

echo "===== COLUMN (board co san 3 cot mac dinh) ====="
req GET /boards/$BOARD/columns 200 "" "$TOKEN"
# Lay 3 column id mac dinh
COLIDS=$(echo "$LAST_RESP" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
COL1=$(echo "$COLIDS" | sed -n '1p')
COL2=$(echo "$COLIDS" | sed -n '2p')
COL3=$(echo "$COLIDS" | sed -n '3p')
echo "default cols: $COL1 $COL2 $COL3"
# Tao cot moi (ten khac)
req POST /boards/$BOARD/columns 201 "{\"name\":\"Backlog\"}" "$TOKEN"
COL4=$(jval "$LAST_RESP" id)
# Tao trung ten -> 400
req POST /boards/$BOARD/columns 400 "{\"name\":\"To Do\"}" "$TOKEN"
req PUT /boards/$BOARD/columns/$COL4 200 "{\"name\":\"Backlog Renamed\"}" "$TOKEN"
req POST /boards/$BOARD/columns 400 "{\"name\":\"\"}" "$TOKEN"

echo "===== LABEL ====="
req POST /boards/$BOARD/labels 201 "{\"name\":\"Urgent\",\"color\":\"#ef4444\"}" "$TOKEN"
LAB1=$(jval "$LAST_RESP" id)
req POST /boards/$BOARD/labels 201 "{\"name\":\"Backend\",\"color\":\"#6366f1\"}" "$TOKEN"
LAB2=$(jval "$LAST_RESP" id)
req GET /boards/$BOARD/labels 200 "" "$TOKEN"
req PUT /boards/$BOARD/labels/$LAB1 200 "{\"name\":\"Critical\",\"color\":\"#dc2626\"}" "$TOKEN"
req POST /boards/$BOARD/labels 400 "{\"name\":\"BadColor\",\"color\":\"red\"}" "$TOKEN"

echo "===== TASK ====="
req POST /boards/$BOARD/tasks 201 "{\"title\":\"Task Feature 1\",\"description\":\"desc\",\"type\":\"FEATURE\",\"columnId\":$COL1}" "$TOKEN"
TASK1=$(jval "$LAST_RESP" id)
req POST /boards/$BOARD/tasks 201 "{\"title\":\"Bug fix login\",\"type\":\"BUG\",\"columnId\":$COL1,\"assigneeId\":$MYID}" "$TOKEN"
TASK2=$(jval "$LAST_RESP" id)
req POST /boards/$BOARD/tasks 201 "{\"title\":\"Epic Q3\",\"type\":\"EPIC\",\"columnId\":$COL2}" "$TOKEN"
TASK3=$(jval "$LAST_RESP" id)
echo "tasks: $TASK1 $TASK2 $TASK3"
req GET "/boards/$BOARD/tasks" 200 "" "$TOKEN"
req GET "/boards/$BOARD/tasks?sortBy=priority" 200 "" "$TOKEN"
req GET "/boards/$BOARD/tasks?sortBy=deadline" 200 "" "$TOKEN"
req GET "/boards/$BOARD/tasks?sortBy=assignee" 200 "" "$TOKEN"
req GET "/boards/$BOARD/tasks?sortBy=createdAt" 200 "" "$TOKEN"
req GET "/boards/$BOARD/tasks?sortBy=invalidField" 200 "" "$TOKEN"
req GET /boards/$BOARD/tasks/$TASK1 200 "" "$TOKEN"
req GET /boards/$BOARD/tasks/column/$COL1 200 "" "$TOKEN"
req PUT /boards/$BOARD/tasks/$TASK1 200 "{\"title\":\"Task Feature 1 updated\",\"priority\":\"HIGH\"}" "$TOKEN"
req PUT /boards/$BOARD/tasks/$TASK1/move 200 "{\"columnId\":$COL2,\"status\":\"IN_PROGRESS\"}" "$TOKEN"
req PUT /boards/$BOARD/tasks/$TASK1/assign 200 "{\"assigneeId\":$MYID}" "$TOKEN"
req POST /boards/$BOARD/tasks 400 "{\"type\":\"FEATURE\",\"columnId\":$COL1}" "$TOKEN"
req POST /boards/$BOARD/tasks 400 "{\"title\":\"Bad type\",\"type\":\"NOPE\",\"columnId\":$COL1}" "$TOKEN"
req GET /boards/$BOARD/tasks/999999 404 "" "$TOKEN"

echo "===== LABEL <-> TASK ====="
req POST /boards/$BOARD/tasks/$TASK1/labels/$LAB1 200 "" "$TOKEN"
req POST /boards/$BOARD/tasks/$TASK1/labels/$LAB2 200 "" "$TOKEN"
req DELETE /boards/$BOARD/tasks/$TASK1/labels/$LAB2 200 "" "$TOKEN"

echo "===== SUBTASK ====="
req POST /boards/$BOARD/tasks/$TASK1/subtasks 201 "{\"title\":\"Subtask A\"}" "$TOKEN"
SUB1=$(jval "$LAST_RESP" id)
req POST /boards/$BOARD/tasks/$TASK1/subtasks 201 "{\"title\":\"Subtask B\"}" "$TOKEN"
SUB2=$(jval "$LAST_RESP" id)
req GET /boards/$BOARD/tasks/$TASK1/subtasks 200 "" "$TOKEN"
req PUT /boards/$BOARD/tasks/$TASK1/subtasks/$SUB1 200 "{\"title\":\"Subtask A done\",\"completed\":true}" "$TOKEN"
req DELETE /boards/$BOARD/tasks/$TASK1/subtasks/$SUB2 200 "" "$TOKEN"
req POST /boards/$BOARD/tasks/$TASK1/subtasks 400 "{\"title\":\"\"}" "$TOKEN"

echo "===== COMMENT ====="
req POST /boards/$BOARD/tasks/$TASK1/comments 201 "{\"content\":\"Comment dau tien\"}" "$TOKEN"
CMT1=$(jval "$LAST_RESP" id)
req GET /boards/$BOARD/tasks/$TASK1/comments 200 "" "$TOKEN"
req PUT /boards/$BOARD/tasks/$TASK1/comments/$CMT1 200 "{\"content\":\"Comment da sua\"}" "$TOKEN"
req POST /boards/$BOARD/tasks/$TASK1/comments 400 "{\"content\":\"\"}" "$TOKEN"

echo "===== ACTIVITY LOG ====="
req GET "/boards/$BOARD/activity" 200 "" "$TOKEN"
req GET "/boards/$BOARD/tasks/$TASK1/activity" 200 "" "$TOKEN"

echo "===== STATISTICS ====="
req GET /boards/$BOARD/statistics 200 "" "$TOKEN"
echo "     stats: ${LAST_RESP:0:300}"

echo "===== NOTIFICATION ====="
req GET /notifications 200 "" "$TOKEN"
req GET /notifications/unread-count 200 "" "$TOKEN"
req PUT /notifications/read-all 200 "" "$TOKEN"

echo "===== INVITE MEMBER (user id=5 qa.tester) ====="
req POST /boards/$BOARD/members 201 "{\"email\":\"qa.tester@taskflow.test\",\"role\":\"MEMBER\"}" "$TOKEN"
req GET /boards/$BOARD/members 200 "" "$TOKEN"
req POST /boards/$BOARD/members 404 "{\"email\":\"khongtontai@x.test\",\"role\":\"MEMBER\"}" "$TOKEN"

echo "===== ARCHIVE ====="
req PUT /boards/$BOARD/archive 200 "" "$TOKEN"
req GET /boards/archived 200 "" "$TOKEN"
req PUT /boards/$BOARD/unarchive 200 "" "$TOKEN"

echo "===== REFRESH TOKEN ====="
req POST /auth/refresh 200 "{\"refreshToken\":\"$REFRESH\"}"

echo "===== CLEANUP ====="
req DELETE /boards/$BOARD/tasks/$TASK1/comments/$CMT1 200 "" "$TOKEN"
req DELETE /boards/$BOARD/tasks/$TASK2 200 "" "$TOKEN"
req DELETE /boards/$BOARD/columns/$COL4 200 "" "$TOKEN"
req DELETE /boards/$BOARD/labels/$LAB1 200 "" "$TOKEN"

echo ""
echo "================================"
echo "TOTAL PASS: $PASSC | FAIL: $FAILC"
echo "================================"
echo -e "$FAILLOG"
