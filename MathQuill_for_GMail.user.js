// ==UserScript==
// @name        MathQuill for Gmail
// @namespace   http://unruh.de
// @include     https://mail.google.com/mail/*
// @version     1
// @require     https://code.jquery.com/jquery-2.2.2.min.js
// @require     https://kodu.ut.ee/~unruh/mathquill-0.10.1/mathquill.min.js
// @grant       GM_xmlhttpRequest
// ==/UserScript==

var MQ = MathQuill.getInterface(2);

var previousActiveElement = null;

/*
  Updates the img-element "img" to show the math described by LaTeX code ltx.

  img -- a jQuery object containing one img
*/
function update_pic(img,ltx) {
	var url = "https://latex.codecogs.com/png.latex?\\dpi{300}\\inline%09" + encodeURIComponent(ltx);
	if (ltx=="") {
	    ltx = "<empty math>";
	    url = "https://latex.codecogs.com/png.latex?\\dpi{300}\\inline%09?";
	}
	img.one("load",function () {
	    try {
		var width = (img[0].naturalWidth*0.36)+"em";
		//console.log("img loaded",width,img[0].naturalWidth,img[0].naturalHeight);
		img.attr("width",width);
		img.attr("height","auto");

		if (img[0].naturalHeight >= 45) {
		    img.attr("style","vertical-align: middle");
		} else
		    img.removeAttr("style");
	    } catch (e) {
		console.error(e);
	    }
	});
    img.attr("style","border: dashed 2px green; filter: blur(.5px)");
    img.attr("src",url);
    img.attr("alt",ltx);
    img.attr("title",ltx);

    // TODO: finish
    get_data_url(url,function (data) { 
	try {
	    console.log("got data url",data);
	    img.attr("src",data);
	} catch (e) {
	    console.error(e);
	}
    });
}

function element_before_cursor() {
    var sel = document.getSelection();
    if (!sel.isCollapsed) return null;
    var range = sel.getRangeAt(0);
    var idx = range.startOffset - 1;
    if (idx < 0) return null;
    var node = range.startContainer.childNodes[idx];
    if (! (node instanceof Element)) return null;
    return node;
};

function mq_close(math) {
    try {
	//console.log("Closing MQ");
	var img = $("#"+math.el().id+"-image");
	var ltx = math.latex();
	update_pic(img,ltx);
	$(math.el()).remove();

	// Put cursor after img
	if (previousActiveElement!=null) previousActiveElement.focus();
	var sel = document.getSelection();
        sel.removeAllRanges();
        var range = document.createRange();
        range.setStartAfter(img[0]);
        range.setEndAfter(img[0]);
        sel.addRange(range);

	//console.log("Closed MQ");
    } catch (e) {
	console.error(e);
	return;
    }
}

function edit_math(img) {
    var id = img.attr("mathquill-id");
    var latex = img.attr("alt");
    if (latex=="<empty math>") latex = "";

    previousActiveElement = document.activeElement;

    //console.log("old id",id);
    if (id==null) {
	id = ("mq-"+Math.random()).replace(".","");
	img.attr("mathquill-id",id);
	img.attr("id",id+"-image");
    } else {
	var math = $("#"+id);
	//console.log("old math",math);
	if (math.length>0) {
	    MQ(math[0]).focus();
	    return;
	}
    }
    
    var mathSpan = $("<span>").attr("id",id);
    img.after(mathSpan);
    img.attr("style","filter: blur(.5px)");

    var math = MQ.MathField(mathSpan[0], {
	handlers: { enter: mq_close },
	});
    math.latex(latex);
    math.focus();
};

// img - Element
function is_mq_img(img) {
    if (img == null) return false;
    if (img.tagName != "IMG") return false;
    if (img.src == null) return false;
    if (!img.src.contains("https://latex.codecogs.com/")) return false;
    return true;
}

function image_handler(event) {
    //console.log("click-listener:",event.target.tagName,event,document.location);
    
    if (event.button != 0) return;
    if (!is_mq_img(event.target)) return;
    
    img = $(event.target);
    
    //console.log("Click on",event.target);
    event.stopPropagation();

    edit_math(img);
    
    //console.log("Click handled");
};

function install_image_click_handler() {
    document.addEventListener("click",image_handler,true);
};

function create_math() {
    var img = $("<img>");
    img.attr("src","https://latex.codecogs.com/png.latex?\\dpi{300}\\inline%09?");
    img.attr("alt","<empty math>");
    img.attr("title","<empty math>");
    img.attr("width","7em");
    img.attr("height","auto");
    //update_pic($(img),"");
    return img[0];
}

function install_key_handler() {
    document.addEventListener("keydown",function(event) {
	try {
	    if (event.ctrlKey && event.keyCode==77) {
		var img = element_before_cursor();
		//console.log("before cursor: ",img);
		if (is_mq_img(img)) {
		    edit_math($(img));
		    return;
		}

		//console.log("Mathquill: insert math");
		event.stopPropagation();

		var img = create_math();
		var sel = document.getSelection();
		sel.deleteFromDocument();
		sel.getRangeAt(0).insertNode(img);
		sel.collapseToEnd();

		edit_math($(img));
		
		//console.log("Inserted");
	    }
	} catch (e) {
		console.error(e);
	}
    }, true);
};

function install_css() {
    try {
	var link = $("<link>").attr("rel","stylesheet").attr("type","text/css").attr("href","https://kodu.ut.ee/~unruh/mathquill-0.10.1/mathquill.css");
	link.appendTo("head");
	//GM_addStyle(GM_getResourceText("mathquillcss").replace(/url\(font\//g,"url(https://raw.githubusercontent.com/dominique-unruh/mathquill-for-gmail/master/font/"));
    } catch (e) {
	console.error(e);
    }
};


// From here: http://stackoverflow.com/a/8781262/2646248
function customBase64Encode (inputStr) {
    var
        bbLen               = 3,
        enCharLen           = 4,
        inpLen              = inputStr.length,
        inx                 = 0,
        jnx,
        keyStr              = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
                            + "0123456789+/=",
        output              = "",
        paddingBytes        = 0;
    var
        bytebuffer          = new Array (bbLen),
        encodedCharIndexes  = new Array (enCharLen);

    while (inx < inpLen) {
        for (jnx = 0;  jnx < bbLen;  ++jnx) {
            /*--- Throw away high-order byte, as documented at:
              https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data
            */
            if (inx < inpLen)
                bytebuffer[jnx] = inputStr.charCodeAt (inx++) & 0xff;
            else
                bytebuffer[jnx] = 0;
        }

        /*--- Get each encoded character, 6 bits at a time.
            index 0: first  6 bits
            index 1: second 6 bits
                        (2 least significant bits from inputStr byte 1
                         + 4 most significant bits from byte 2)
            index 2: third  6 bits
                        (4 least significant bits from inputStr byte 2
                         + 2 most significant bits from byte 3)
            index 3: forth  6 bits (6 least significant bits from inputStr byte 3)
        */
        encodedCharIndexes[0] = bytebuffer[0] >> 2;
        encodedCharIndexes[1] = ( (bytebuffer[0] & 0x3) << 4)   |  (bytebuffer[1] >> 4);
        encodedCharIndexes[2] = ( (bytebuffer[1] & 0x0f) << 2)  |  (bytebuffer[2] >> 6);
        encodedCharIndexes[3] = bytebuffer[2] & 0x3f;

        //--- Determine whether padding happened, and adjust accordingly.
        paddingBytes          = inx - (inpLen - 1);
        switch (paddingBytes) {
            case 1:
                // Set last character to padding char
                encodedCharIndexes[3] = 64;
                break;
            case 2:
                // Set last 2 characters to padding char
                encodedCharIndexes[3] = 64;
                encodedCharIndexes[2] = 64;
                break;
            default:
                break; // No padding - proceed
        }

        /*--- Now grab each appropriate character out of our keystring,
            based on our index array and append it to the output string.
        */
        for (jnx = 0;  jnx < enCharLen;  ++jnx)
            output += keyStr.charAt ( encodedCharIndexes[jnx] );
    }
    return output;
}

function get_data_url(url,callback) {
    try {
	/*
	var req = new XMLHttpRequest();
	req.overrideMimeType("text/plain; charset=x-user-defined");
	req.addEventListener("load",function (evt) { 
	    console.log("done",evt,req,this);
	    console.log("base64",btoa(this.responseText));
	});
	req.open("GET",url);
	req.send();
	*/
	console.log("GM_xmlhttpRequest");
	//url = "https://latex.codecogs.com/png.latex?\\dpi{300}\\inline%09\\frac{abcef}{ccc}";
	GM_xmlhttpRequest({
	    url: url,
	    method: "GET",
	    binary: true,
	    overrideMimeType: "text/plain; charset=x-user-defined",
	    onload: function (resp) {
		try {
		    console.log("done",resp,this,resp.finalUrl);
		    dataurl = "data:image/png;base64,"+customBase64Encode(resp.responseText);
		    callback(dataurl);
		} catch (e) {
		    console.error(e);
		}
	    },
	    onerror: function (resp) {
		try {
		    console.log("Could not load",url,resp);
		} catch (e) {
		    console.error(e);
		}
	    },
	});
	console.log("GM_xmlhttpRequest invoked");
    } catch (e) {
	console.error(e);
    }
}

install_css();
install_image_click_handler();
install_key_handler();

console.log("MathQuill script loaded on "+document.location);
