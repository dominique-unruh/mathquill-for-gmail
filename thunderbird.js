/* Background page for Thunderbird. Registers the relevant files for loading in all compose windows. */

let registeredScripts = browser.composeScripts.register({
  css: [
    { file: "mathquill.css" },
  ],
  js: [
    { code: "browser.mathquill_for_thunderbird = true;"}, // Set a flag so that the scripts below know that we are in Thunderbird
    { file: "jquery.min.js" },
    { file: "mathquill.min.js" },
    { file: "browser-polyfill.min.js" },
    { file: "shared.js" },
    { file: "mathquill-for-gmail.js" },
  ],
});
