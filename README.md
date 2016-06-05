# MathQuill for Gmail

This plugin (Greasemonkey userscript) allows you to edit formulas in Gmail messages using a graphical formula editor.

The script uses [MathQuill] (http://mathquill.com/) as the formula
editor, and the [CodeCogs server] (https://latex.codecogs.com/) (with
their generous permission [\[1\]](#codecogs)) for generating the images.

## Installation

### Firefox

* Install the [Greasemonkey addon] (https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/).
* Open [MathQuill_for_Gmail.user.js] (https://github.com/dominique-unruh/mathquill-for-gmail/raw/install/MathQuill_for_Gmail.user.js) to install the plugin. (Firefox should automatically ask whether you want to install it.)
* Activate the plugin (via Tools->Greasemonkey->Manage User Scripts).
* If Gmail is already open, reload the page.

### Chrome / Chromium

* Install the [Tampermonkey extension] (https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
* Open [MathQuill_for_Gmail.user.js] (https://github.com/dominique-unruh/mathquill-for-gmail/raw/install/MathQuill_for_Gmail.user.js) to install the plugin. (Chrome should offer you the option to install it now.)
* If Gmail is already open, reload the page.

## Usage

When editing a mail, press Ctrl-M to insert a formula. Edit the formula that appears in the interactive formula editor. Press enter to convert it into a picture. (You have to exit the formula editor via enter, otherwise the picture will not be updated.)

To edit an existing formula, either click on it, or position the cursor after it and press Ctrl-M.

### Using the plugin on other webpages

It should be possible to use the plugin also on other webpages
than Gmail. (As long as they use rich text editors.) For example, the
WordPress editor seems to work with this plugin.

To enable the plugin on other pages, add the corresponding pages
to the list of includes pages in the Greasemonkey/Tampermonkey options
for the plugin. E.g., add `https://wordpress.com/post/*` to enable
the plugin in the WordPress editor.

Your milage may vary depending on the way the rich text editor is
implemented.

## Quirks

The plugin has a number of quirks:
* If you close the compose window, or Gmail while a formula editor is still open, a textbox and some useless characters will be included in your mail. Always leave the formula editor with enter. (#3)
* When clicking on a formula to edit it, the formula editor will appear, but there will also be Gmail's menu for resizing the picture! You can simply ignore it, it vanishes as soon as you start typing. (#4)
* In Chromium, when you edit an empty formula and type the first letter, the formula editor loses focus. Simply press Ctrl-M or click on the formula editor to get the focus back. (#2)
* Paste (e.g., Ctrl-V) does not work. (#1)

(For anything you would like fixed, please express so in the corresponding [issue] (https://github.com/dominique-unruh/mathquill-for-gmail/issues). I am more likely to try and fix a problem if there is expressed interest.)

----

<sup><a name="codecogs"/>[1] Please note that if you are generating a lot of equations from a single domain, i.e. over 3000/day, then you may need to arrange a commercial licence with CodeCogs to support continued hosting of the service. Please see their terms and conditions: http://www.codecogs.com/latex/usage.php.</sup>
