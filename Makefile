MATHQUILL_VERSION=0.10.1

mathquill.css mathquill.min.js font : Makefile
	rm -rf $@ mathquill-$(MATHQUILL_VERSION).zip mathquill-$(MATHQUILL_VERSION)
	wget -O mathquill-$(MATHQUILL_VERSION).zip https://github.com/mathquill/mathquill/archive/v$(MATHQUILL_VERSION).zip
	unzip mathquill-$(MATHQUILL_VERSION).zip
	make -C mathquill-$(MATHQUILL_VERSION)
	cp -r mathquill-$(MATHQUILL_VERSION)/build/mathquill.css mathquill-$(MATHQUILL_VERSION)/build/mathquill.min.js mathquill-$(MATHQUILL_VERSION)/build/font .
