#!/bin/bash

# Puts the current date in the version of MathQuill_for_Gmail.user.js

DATE="`date +%Y%m%d`"

ed MathQuill_for_Gmail.user.js <<EOF
/^\/\/ @version/
s/rev.*\$/rev$DATE/
w
q
EOF
