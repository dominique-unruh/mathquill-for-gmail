var js_files = ["jquery.min.js",
		"mathquill.min.js",
		"browser-polyfill.min.js",
		"shared.js",
		"mathquill-for-gmail.js"];

document.addEventListener("click", async function (e) {
    console.log(e);
    if (e.target.classList.contains("menuitem")) {
	var command = e.target.getAttribute('name');
	if (command == "options") browser.runtime.openOptionsPage();
	else if (command == "activate") {
	    var i;
	    for (i=0; i<js_files.length; i++) {
		await browser.tabs.executeScript(null, {file: js_files[i]});
	    };
	}
	
	window.close();
    }
});
