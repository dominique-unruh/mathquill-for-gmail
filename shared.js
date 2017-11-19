// Functions shared by mathquill_for_gmail.user.js and options.js

async function get_option_with_default(option) {
    var value = await browser.storage.sync.get(option);
    if (value.hasOwnProperty(option))
	return value[option]

    if (option=="hotkey")
      return "ctrl-m";
    else {
      console.error("No default for option "+option);
      return undefined;
    }
}

function parse_hotkey(hotkey) {
  var parts = hotkey.split("-");
  hotkey_ctrl = false;
  hotkey_alt = false;
  hotkey_shift = false;
  while (parts.length>1) {
    var part = parts[0].toLowerCase();
    if (part=="ctrl")
      hotkey_ctrl = true;
    else if (part=="shift")
      hotkey_shift = true;
    else if (part=="alt")
      hotkey_alt = true;
    else
      break;
    parts.shift();
  }
  if (parts.length!=1) {
    console.error("Invalid hotkey "+hotkey+" (invalid suffix "+parts.join("-")+")");
    return null;
  }
  part = parts[0];
  if (part.length != 1) {
    console.error("Invalid hotkey "+hotkey+" (last part should be a single letter)",hotkey,parts,part);
    return null;
  }
  var chr = part[0].toUpperCase();
  if (chr < 'A' || chr > 'Z') {
    console.error("Invalid hotkey "+hotkey+" (last part should be a-z)",hotkey,parts,part,chr);
    return null;
  }
  hotkey_keycode = chr.charCodeAt(0);
  return true;
}


// Local Variables:
// indent-tabs-mode: nil
// js-indent-level: 2
// End:
