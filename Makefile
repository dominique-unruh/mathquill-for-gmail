MATHQUILL_VERSION=0.10.1

all : git

git : up_version
	nohup git-gui &
	sleep 60

build : browser-polyfill.min.js mathquill.min.js jquery.min.js
	web-ext build -o -i mathquill Makefile "*~" README.md run

browser-polyfill.min.js:
	if ! [ -e webextension-polyfill ]; then git clone https://github.com/mozilla/webextension-polyfill.git; fi
	cd webextension-polyfill && git pull
	cd webextension-polyfill && npm install
	cd webextension-polyfill && npm run build
	cd webextension-polyfill && npm run test
	cp webextension-polyfill/dist/browser-polyfill.min.js browser-polyfill.min.js

mathquill.min.js:
	if ! [ -e mathquill ]; then git clone git@github.com:dominique-unruh/mathquill.git; fi
	cd mathquill && git checkout for-gmail
	cd mathquill && git pull
	cd mathquill && npm install
	make -C mathquill
	cp mathquill/build/mathquill.min.js mathquill.min.js

up_version :
	./up-version.sh

#toc :
#	 # Installation: npm install doctoc
#	node_modules/doctoc/doctoc.js README.md
