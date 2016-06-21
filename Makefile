MATHQUILL_VERSION=0.10.1

all : git

git : up_version
	nohup git-gui &
	sleep 60

up_version :
	./up-version.sh

#toc :
#	 # Installation: npm install doctoc
#	node_modules/doctoc/doctoc.js README.md
