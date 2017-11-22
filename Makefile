MATHQUILL_VERSION=0.10.1

all : build/mathquill_for_gmail_firefox.zip build/mathquill_for_gmail_chrome.zip

GENERATED = browser-polyfill.min.js mathquill.min.js jquery.min.js icon-32.png icon-16.png icon-48.png icon-96.png icon-128.png icon-64.png

FILES = $(GENERATED) Changelog LICENSE manifest.json options.html options.js shared.js toolbar-menu.html toolbar-menu.js mathquill-for-gmail.js

icon-%.png : icon.svg Makefile
	SIZE=$@; SIZE="$${SIZE%.png}"; SIZE="$${SIZE#icon-}"; \
	  inkscape --export-png=$@ --export-background-opacity=0 -w "$$SIZE" --without-gui $<

prereqs : $(GENERATED)

build/mathquill_for_gmail_firefox.zip : $(FILES)
	mkdir -p build
	rm -f $@
	zip $@ $(FILES)

build/mathquill_for_gmail_chrome.zip : build/mathquill_for_gmail_firefox.zip manifest.chrome.json
	mkdir -p tmp
	cp manifest.chrome.json tmp/manifest.json
	cp $< $@
	zip --junk-paths $@ tmp/manifest.json

manifest.chrome.json : manifest.json
	python3 mk_chrome_manifest.py

lint : $(GENERATED)
	web-ext lint -i mathquill Makefile "*~" README.md run jquery.min.js

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

screenshots/%-1280.png : screenshots/%.png
	convert $< -resize 1280x800 -gravity center -extent 1280x800 $@
