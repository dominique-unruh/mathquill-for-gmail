all : build/mathquill_for_gmail_firefox.zip build/mathquill_for_gmail_chrome.zip build/mathquill_for_gmail_thunderbird.zip

GENERATED = browser-polyfill.min.js mathquill.min.js mathquill.css jquery.min.js icon-32.png icon-16.png icon-48.png icon-96.png icon-128.png icon-64.png

FILES = $(GENERATED) Changelog LICENSE manifest.json options.html options.js shared.js toolbar-menu.html toolbar-menu.js mathquill-for-gmail.js thunderbird.js

icon-%.png : icon.svg Makefile
	SIZE=$@; SIZE="$${SIZE%.png}"; SIZE="$${SIZE#icon-}"; \
	  inkscape --export-type=png --export-filename=$@ --export-background-opacity=0 -w "$$SIZE" $<

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

build/mathquill_for_gmail_thunderbird.zip : build/mathquill_for_gmail_firefox.zip manifest.thunderbird.json
	mkdir -p tmp
	cp manifest.thunderbird.json tmp/manifest.json
	cp $< $@
	zip --junk-paths $@ tmp/manifest.json
	#zip $@ fonts/Symbola.woff2

manifest.chrome.json : manifest.json
	python3 mk_chrome_manifest.py

lint : $(GENERATED)
	web-ext lint -i mathquill Makefile "*~" README.md run

BROWSER_POLYFILL_VERSION = 0.9.0
browser-polyfill.min.js : Makefile
	if ! [ -e webextension-polyfill ]; then git clone --config core.filemode=false --depth 1 --branch $(BROWSER_POLYFILL_VERSION) https://github.com/mozilla/webextension-polyfill.git; fi
	cd webextension-polyfill && git checkout $(BROWSER_POLYFILL_VERSION)
	cd webextension-polyfill && npm install
	cd webextension-polyfill && npm run build
	cd webextension-polyfill && npm run test
	cp webextension-polyfill/dist/browser-polyfill.min.js browser-polyfill.min.js

MATHQUILL_PATCHES = unruh/macros unruh/mathcal unruh/cases # unruh/symbola-from-cdn
MATHQUILL_MASTER = 685bda1154bb361b36ef1a834bf71686a1231c5d

mathquill.min.js mathquill.css : Makefile
	if ! [ -e mathquill ]; then git clone --config core.filemode=false git@github.com:mathquill/mathquill.git; fi
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
	mkdir -p fonts
	#cp mathquill/build/fonts/Symbola.woff2 fonts/

screenshots/%-1280.png : screenshots/%.png
	convert $< -resize 1280x800 -gravity center -extent 1280x800 $@

jquery.min.js : Makefile
	curl https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js > $@
