#!/bin/bash

DATE="`date +%Y%m%d`"

ed MathQuill_for_GMail.user.js <<EOF
/^\/\/ @version/
s/rev.*\$/rev$DATE/
w
q
EOF
