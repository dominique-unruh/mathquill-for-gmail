MATHQUILL_VERSION=0.10.1

all : up_version toc

up_version :
	./up-version.sh

toc :
	 # Installation: npm install doctoc
	node_modules/doctoc/doctoc.js README.md
