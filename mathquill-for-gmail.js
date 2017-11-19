
// TODO: browser action for activating MathQuill on any given page: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/Tabs/executeScript, https://developer.mozilla.org/en-US/Add-ons/WebExtensions/user_interface/Browser_action

document.body.style.border = "5px solid blue";

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
      reset_pic(img);
    } catch (e) {
      console.error(e);
    }
  });
  img0.style.border = "dashed 2px green";
  img0.style.filter = "blur(.5px)";
  img.attr("src",url);
  img.attr("alt",ltx);
  img.attr("title",ltx);
}

function reset_pic(img) {
  var img0 = img[0];

  if (img0.title == "<empty math>") {
    img.remove();
    return;
  }

  var width = (img0.naturalWidth*0.028)+"em";
  img.removeAttr("style");
  img0.style.height = "auto";
  img0.style.width = width;
  
  if (img[0].naturalHeight >= 45)
    img0.style.verticalAlign = "middle";
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
    (And updates the image, and puts cursor and focus back in place.) 

    If update==true, the image is updated, otherwise the edit is canceled
*/
function mq_close(math,update) {
  try {
    //console.log("Closing MQ");
    current_math = null;
    var img = $("#"+math.el().id+"-image");
    var ltx = math.latex();
    $(math.el()).remove();

    // Put cursor after img
    if (previousActiveElement!=null) previousActiveElement.focus();
    var sel = document.getSelection();
    sel.removeAllRanges();
    var range = document.createRange();
    range.setStartAfter(img[0]);
    range.setEndAfter(img[0]);
    sel.addRange(range);
    if (update) 
      update_pic(img,ltx); // Should happen after fixing cursor since it may delete the img
    else
      reset_pic(img);
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

  if (id!==null && id!==undefined) {
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
  img[0].style.filter = "blur(.5px)";

  
  var math = MQ.MathField(mathSpan[0], {
    handlers: { enter: function (m) { mq_close(m,true); } },
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
      console.log("paste event",current_math,event);
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
        console.log("keydown",event,event.keyCode);

        if (event.keyCode == 27) { // ESC
          mq_close(current_math,false);
          event.stopImmediatePropagation();
          event.stopPropagation();
          event.preventDefault();
          return;
        } else
          reroute_event(event);
        return;
      }

      /* console.log("checking key",event.ctrlKey==hotkey_ctrl && event.shiftKey==hotkey_shift && event.altKey==hotkey_alt && event.keyCode==hotkey_keycode,
                  event.ctrlKey==hotkey_ctrl, event.shiftKey==hotkey_shift, event.altKey==hotkey_alt, event.keyCode==hotkey_keycode,
                  "config",hotkey_ctrl, hotkey_shift, hotkey_alt, hotkey_keycode             )  */
      if (event.ctrlKey==hotkey_ctrl && event.shiftKey==hotkey_shift && event.altKey==hotkey_alt && event.keyCode==hotkey_keycode) {
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

/* Adds the mathquill.css style-sheet to the current page (needed for math editors to render correctly */
function install_css() {
  try {
    var link = $("<link>").attr("rel","stylesheet").attr("type","text/css").attr("href","https://cdn.rawgit.com/dominique-unruh/mathquill/ea34612/cdn/mathquill.css");
    link.appendTo("head");
  } catch (e) {
    console.error(e);
  }
}



/* Adds macros to the MathQuill editor. Currently these are hardcoded.
   TODO: configurable macros */
function add_macros() {
  MQ.addMacro("abs","\\left|\\cursor\\right|");
  MQ.addMacro("norm","\\left\\lVert\\cursor\\right\\rVert");
  MQ.addMacro("ket","\\left|\\cursor\\right\\rangle");
  MQ.addMacro("bra","\\left\\langle\\cursor\\right|");
  MQ.addMacro("braket","\\left\\langle\\cursor\\mid\\right\\rangle");
}



/* Main program */

async function main() {
  parse_hotkey(await get_option_with_default("hotkey"));
  install_css();
  install_image_click_handler();
  install_keydown_handler();
  install_keypress_handler();
  install_paste_handler();
  add_macros();
  // GM_registerMenuCommand("MathQuill for Gmail - Options",
  //                        function() {
  //                          try {
  //                            GM_openInTab("https://cdn.rawgit.com/dominique-unruh/mathquill-for-gmail/b1d6409/mathquill-for-gmail-options.html",false);
  //                          } catch (e) {
  //                            console.error(e);
  //                          }},
  //                        "q");
  
  // if (document.location=="https://cdn.rawgit.com/dominique-unruh/mathquill-for-gmail/b1d6409/mathquill-for-gmail-options.html") {
  //   console.log("Options page");
  //   options_page();
  // };
  console.log("MathQuill script loaded on "+document.location);
};

main();



// Local Variables:
// indent-tabs-mode: nil
// js-indent-level: 2
// End:
