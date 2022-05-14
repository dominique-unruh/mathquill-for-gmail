function save_options() {
    $(".option").each(async function () {
	if ($(this).hasClass("changed")) {
            console.log("Saving option: "+this.name+" := "+this.value);
	    var obj = {};
            obj[this.name] = this.value;
            await browser.storage.sync.set(obj);
	    console.log("Option saved.");
	}
    });
    console.log("saving done");
};


function check_options() {
    var hotkey = $("#hotkey")[0].value;
    var parse_success = parse_hotkey(hotkey);
    console.log("hotkey",parse_success);
    if (parse_success===null)
	return "Invalid hotkey '"+hotkey+"'";
    var macros = $("#macros")[0].value;
    var parse_success = parse_macros(macros);
    console.log("macros",parse_success);
    if (parse_success===null)
	return "Invalid macro definition '"+macros+"'";
    return null;
};

function restore_options() {
    $(".option").each(async function () {
	var name = this.name;
	this.value = await get_option_with_default(name);
    });
}

restore_options();

$(".option").on("input",function () {
    $("#save").removeAttr("disabled"); $(this).addClass("changed"); });

$(".reset").on("click", function () {
  var option = $(this).attr('name');
  var def = get_option_default(option);
  $("#"+option).addClass("changed");
  $("#"+option)[0].value = def;
  $("#save").removeAttr("disabled");
});

$("#save").on("click",function () { 
    var error = check_options();
    if (error==null) {
        $("#error").text("");
    } else {          
        $("#error").text("ERROR: "+error+" (options not saved)");
        return;
    }
    save_options();
    $("#save").attr("disabled","disabled");
    $(".option").removeClass("changed");
});


browser.storage.local.get().then(console.log,console.error);
