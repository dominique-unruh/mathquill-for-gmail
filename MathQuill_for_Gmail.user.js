// ==UserScript==
// @name        MathQuill for Gmail
// @namespace   http://unruh.de
// @include     https://mail.google.com/mail/*
// @include     https://kodu.ut.ee/~unruh/mathquill-for-gmail-options.html
// @version     0.0.2rev20160605
// @require     https://code.jquery.com/jquery-2.2.2.min.js
// @require     https://kodu.ut.ee/~unruh/mathquill-0.10.1/mathquill.min.js
// @resource    options_html options.html
// @grant       GM_registerMenuCommand
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_openInTab
// ==/UserScript==

var MQ = MathQuill.getInterface(2);

/** The document that was active (focussed) before the math editor was opened.
    (It should get the focus back after editing.) */
var previousActiveElement = null;
/** The current math editor (if there is one) */
var current_math = null;

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
  var img0 = img[0];
  img.one("load",function () {
    try {
      var width = (img0.naturalWidth*0.028)+"em";
      //console.log("img loaded",width,img[0].naturalWidth,img[0].naturalHeight);
      //img.attr("width",width);
      //img.attr("height","auto");
      img.removeAttr("style");
      img0.style.height = "auto";
      img0.style.width = width;

      if (img[0].naturalHeight >= 45)
        img0.style.verticalAlign = "middle";

    } catch (e) {
      console.error(e);
    }
  });
  img0.style.border = "dashed 2px green";
  img0.style.filter = "blur(.5px)";
  //img.attr("style","border: dashed 2px green; filter: blur(.5px)");
  img.attr("src",url);
  img.attr("alt",ltx);
  img.attr("title",ltx);
}

/* Returns the element just before the cursor.

   Will return null if before the cursor is not an element (but, e.g., text).
   Will return null if the selection is a range. 
   Ignores non-text/element nodes (e.g., comment nodes).
*/
function element_before_cursor() {
  var sel = document.getSelection();
  if (!sel.isCollapsed) return null;
  var range = sel.getRangeAt(0).cloneRange();
  var idx = range.startOffset - 1;
  var container = range.startContainer;
console.log("element_before_cursor",container,idx);
  while (true) { // Invariant: the node we look for is left of the start of the range.
    if (range.startOffset <= 0) {
      range.selectNode(range.startContainer);
      continue;
    }
    if (range.startContainer instanceof Text) return null;
    var node = range.startContainer.childNodes[range.startOffset-1];
    if (node instanceof Element) return node;
    if (node instanceof Text && node.textContent!="") return null;
    // skip this node
    range.selectNode(node);
  }
};

/** Closes the current math editor. 
    (And updates the image, and puts cursor and focus back in place.) */
function mq_close(math) {
  try {
    //console.log("Closing MQ");
    current_math = null;
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

  if (id!==null) {
    var m = $("#"+id);
    if (m.length>0) {
      current_math = MQ(m[0]).focus();
      return;
    }
  }

  id = ("mq-"+Math.random()).replace(".","");
  img.attr("mathquill-id",id);
  img.attr("id",id+"-image");

  var mathSpan = $("<span>").attr("id",id);
  img.after(mathSpan);
  img[0].style.filter = "filter: blur(.5px)";

  var math = MQ.MathField(mathSpan[0], {
    handlers: { enter: mq_close },
  });
  math.latex(latex);
  math.focus();
  current_math = math;
}

// img - Element
function is_mq_img(img) {
  if (img == null) return false;
  if (img.tagName != "IMG") return false;
  if (img.src == null) return false;
  if (!img.src.startsWith("https://latex.codecogs.com/") && !img.src.startsWith("http://latex.codecogs.com/")) return false;
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
  window.addEventListener("click",image_handler,true);
};

function create_math() {
  var img = $("<img>");
  img.attr("src","https://latex.codecogs.com/png.latex?\\dpi{300}\\inline%09?");
  img.attr("alt","<empty math>");
  img.attr("title","<empty math>");
  img[0].style.width = ".5em";
  img[0].style.height = "auto";
  //img.attr("width","7em");
  //img.attr("height","auto");
  //update_pic($(img),"");
  return img[0];
}

/* Reroutes an event to current_math object */
function reroute_event(event) {
  current_math.focus();
  var event2 = $.Event(event.type,event);
  event.stopPropagation();
  event.stopImmediatePropagation();
  // console.log("redispatching",event,event2,current_math);
  event2.preventDefault = function() { event.preventDefault(); };
  $(current_math.el()).trigger(event2);
}

function install_paste_handler() {
  window.addEventListener("paste",function(event) {
    try {
      console.log("paste event",current_math,event,event.clipboardData.getData('text/plain'));
      if (current_math!==null) {
/*          console.log("discarding paste event");
          event.stopPropagation();
          event.preventDefault();
          event.stopImmediatePropagation();
          current_math.focus();
          current_math.paste("hello"); */
        reroute_event(event);
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }, true);
}

function install_keypress_handler() {
  window.addEventListener("keypress",function(event) {
    try {
      // If there is an active math editor, dispatch keydown events directly to that math editor
      // This avoids triggering key events of the webpage
      if (current_math!==null) {
        reroute_event(event);
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }, true);
}


function install_keydown_handler() {
  window.addEventListener("keydown",function(event) {
    try {
      // If there is an active math editor, dispatch keydown events directly to that math editor
      // This avoids triggering key events of the webpage
      if (current_math!==null) {
        reroute_event(event);
        return;
      }

      if (event.ctrlKey && event.keyCode==77) {
        var img = element_before_cursor();
        console.log("before cursor: ",img);
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
}

function install_css() {
  try {
    var link = $("<link>").attr("rel","stylesheet").attr("type","text/css").attr("href","https://kodu.ut.ee/~unruh/mathquill-0.10.1/mathquill.css");
        link.appendTo("head");
        //GM_addStyle(GM_getResourceText("mathquillcss").replace(/url\(font\//g,"url(https://raw.githubusercontent.com/dominique-unruh/mathquill-for-gmail/master/font/"));
    } catch (e) {
        console.error(e);
    }
}

function get_option_with_default(option) {
  var value = GM_getValue(option);
  if (value==undefined) {
    if (option=="hotkey")
      return "ctrl+m";
    else {
      console.error("No default for option "+option);
      return undefined;
    }
  } else
    return value;
}

function options_page() {
  try {
    document.body.innerHTML = GM_getResourceText("options_html");

    $(".option").each(function () {
      var name = this.name;
      this.value = get_option_with_default(name);
    });

    $(".option").on("input",function () { $("#save").removeAttr("disabled"); $(this).addClass("changed"); });


    $("#save").on("click",function () { 
      try {
        $(".option").each(function () {
          var name = this.name;
          var value = this.value;
          GM_setValue(name,value);
        });
        $("#save").attr("disabled","disabled");
        $(".option").removeClass("changed");
      } catch (e) {
        console.error(e);
      }
    });

  } catch (e) {
    console.error(e);
  }
}

if (document.location=="https://kodu.ut.ee/~unruh/mathquill-for-gmail-options.html") {
  console.log("Options page");
  options_page();
} else {
  install_css();
  install_image_click_handler();
  install_keydown_handler();
  install_keypress_handler();
  install_paste_handler();
  GM_registerMenuCommand("MathQuill for Gmail - Options",
                         function() {
                           try {
                             GM_openInTab("https://kodu.ut.ee/~unruh/mathquill-for-gmail-options.html",false);
                           } catch (e) {
                             console.error(e);
                           }},
                         "q");
}

console.log("MathQuill script loaded on "+document.location);

// Local Variables:
// indent-tabs-mode: nil
// End:
