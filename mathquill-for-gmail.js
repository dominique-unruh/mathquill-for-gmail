var MQ = MathQuill.getInterface(2);

/** The document that was active (focussed) before the math editor was opened.
    (It should get the focus back after editing.) */
var previousActiveElement = null;
/** The current math editor (if there is one) */
var current_math = null;

var renderurl = get_option_with_default("renderurl");
/** Extra style to be added to the element. */
var user_style = get_option_with_default("style");
/** Extra HTML fragment to be added to the mail. */
var user_html_insert = get_option_with_default("html_insert");

async function get_render_url(latex) {
  console.log("renderurl",await renderurl);
  return (await renderurl).replace("@@@",encodeURIComponent(latex));
};

/*
  Updates the img-element "img" to show the math described by LaTeX code ltx.

  img -- a jQuery object containing one img
*/
async function update_pic(img, ltx) {
  var url;
  if (ltx=="") {
    ltx = "<empty math>";
    url = await get_render_url("?");
  } else
    url = await get_render_url(ltx);

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

/** Sets size and style of the formula-picture.
  Must only be called when the picture is loaded.
  If the formula is empty, it is removed.
*/
async function reset_pic(img) {
  var img0 = img[0];

  if (img0.title == "<empty math>") {
    img.remove();
    return;
  }

  var scaling = 0.028;
  var width = (img0.naturalWidth*scaling)+"em";
  img.attr("style", await user_style);
  img0.style.height = "auto";
  img0.style.width = width;

  if (img[0].naturalHeight >= 45)
    img0.style.verticalAlign = "middle";

  insert_user_html_insert(img);
}

/** Inserts user specified HTML code in the email (unless already there).
 It is inserted by default at the beginning of the element that contains `img`.
 `img` is a jQuery object.
 */
async function insert_user_html_insert(img) {
  var html = await user_html_insert;
  if ($("#mq-user-html-fragment").length) return;
  var span = $('<span>');
  span.attr("id", "mq-user-html-fragment");
  span.attr("style", "visibility: hidden; width: 0;");
  span.append(html);
  img.parent().prepend(span);
  console.log("doc", document.body.innerHTML);
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
async function mq_close(math,update) {
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
      await update_pic(img,ltx); // Should happen after fixing cursor since it may delete the img
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
  var src = img.src;
  if (src == null) return false;
  if (!src.startsWith("https://latex.codecogs.com/") &&
      !src.startsWith("http://latex.codecogs.com/") &&
      !src.startsWith("https://chart.googleapis.com/chart?")
     ) return false; // Only recognizes known rendering URLs. Can we recognize custom ones?
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

async function create_math() {
  var img = $("<img>");
  img.attr("src",await get_render_url("?"));
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
  event.stopPropagation();
  event.stopImmediatePropagation();
  if (browser.mathquill_for_thunderbird && event.type == "keydown" && !event.altKey && !event.ctrlKey && event.key.length==1) {
    // For some reason, in Thunderbird, normal keys (letters etc.) are not understood by MathQuill. So we catch them here and pass to MQ via .typedText
    event.preventDefault();
    current_math.typedText(event.key);
    return;
  }
  var event2 = $.Event(event.type,event);
  if (browser.mathquill_for_thunderbird)
    // In Thunderbird, the target is the whole body and MQ will ignore the key. We fix the target to be the expected one.
    event2.target = current_math.el().firstChild.firstChild;
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
  window.addEventListener("keydown", async function(event) {
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
        } else if (browser.mathquill_for_thunderbird && (event.keyCode == 10 || event.keyCode == 13) && !event.shiftKey && !event.ctrlKey && !event.altKey) { // Enter
          // The enter-hander register in edit_math doesn't work in Thunderbird, so we catch Enter ourselves
          mq_close(current_math,true);
          event.stopImmediatePropagation();
          event.stopPropagation();
          event.preventDefault();
          return;
        } else
          reroute_event(event);
        return;
      }
      
      if (event.ctrlKey==hotkey_ctrl && event.shiftKey==hotkey_shift && event.altKey==hotkey_alt && event.keyCode==hotkey_keycode) {

        var img = element_before_cursor();
        console.log("before cursor: ",img);
        if (is_mq_img(img)) {
          edit_math($(img));
          return;
        }

        //console.log("Mathquill: insert math");
        event.stopPropagation();

        var img = await create_math();
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


/* Adds macros to the MathQuill editor. */
async function add_macros() {
  var macros = parse_macros(await get_option_with_default("macros"));
  for (var i=0; i<macros.length; i++)
    MQ.addMacro(macros[i].name,macros[i].code);
}



/* Main program */

async function main() {
  parse_hotkey(await get_option_with_default("hotkey"));
  //install_css(); // Done via manifest.json
  install_image_click_handler();
  install_keydown_handler();
  install_keypress_handler();
  install_paste_handler();
  add_macros();
  console.log("MathQuill script loaded on "+document.location);
};

main();



// Local Variables:
// indent-tabs-mode: nil
// js-indent-level: 2
// End:
