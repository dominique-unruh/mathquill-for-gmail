MATHQUILL_VERSION=0.10.1

all : build/mathquill_for_gmail_firefox.zip build/mathquill_for_gmail_chrome.zip

GENERATED = browser-polyfill.min.js mathquill.min.js mathquill.css jquery.min.js icon-32.png icon-16.png icon-48.png icon-96.png icon-128.png icon-64.png

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
	web-ext lint -i mathquill Makefile "*~" README.md run

browser-polyfill.min.js:
	if ! [ -e webextension-polyfill ]; then git clone https://github.com/mozilla/webextension-polyfill.git; fi
	cd webextension-polyfill && git pull
	cd webextension-polyfill && npm install
	cd webextension-polyfill && npm run build
	cd webextension-polyfill && npm run test
	cp webextension-polyfill/dist/browser-polyfill.min.js browser-polyfill.min.js

MATHQUILL_PATCHES = unruh/macros unruh/mathcal unruh/cases
MATHQUILL_MASTER = 685bda1154bb361b36ef1a834bf71686a1231c5d

mathquill.min.js mathquill.css:
	if ! [ -e mathquill ]; then git clone git@github.com:mathquill/mathquill.git; fi
	cd mathquill && if ! git remote | grep '^unruh$$'; then git remote add unruh git@github.com:dominique-unruh/mathquill.git; fi
	cd mathquill && git stash
	cd mathquill && git fetch origin
	cd mathquill && git fetch unruh
	cd mathquill && git checkout $(MATHQUILL_MASTER)
	cd mathquill && for i in $(MATHQUILL_PATCHES); do git merge -m "Merging $$i" "$$i"; done
	#patch -i ../patch1 -u -d mathquill -p1

	cd mathquill && npm install
	make -C mathquill
	cp mathquill/build/mathquill.min.js mathquill.min.js
	cp mathquill/build/mathquill.css mathquill.css

up_version :
	./up-version.sh

#toc :
#	 # Installation: npm install doctoc
#	node_modules/doctoc/doctoc.js README.md

screenshots/%-1280.png : screenshots/%.png
	convert $< -resize 1280x800 -gravity center -extent 1280x800 $@
