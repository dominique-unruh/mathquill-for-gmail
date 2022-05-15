// Functions shared by mathquill_for_gmail.user.js and options.js

//var hotkey_keycode;

function get_option_default(option) {
  if (option=="hotkey")
    return "ctrl-m";
  else if (option=="macros")
    return "\\abs = \\left|\\cursor\\right| \n\
\\norm = \\left\\lVert\\cursor\\right\\rVert \n\
\\ket = \\left|\\cursor\\right\\rangle \n\
\\bra = \\left\\langle\\cursor\\right| \n\
\\braket = \\left\\langle\\cursor\\mid\\right\\rangle";
  else if (option=="renderurl")
    return "https://latex.codecogs.com/png.latex?\\dpi{300}\\inline%09@@@";
  else if (option=="style")
    return "filter: url(#mq-color-filter);";
  else if (option=="html_insert")
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">\n\
  <filter id="mq-color-filter">\n\
    <feFlood flood-color="currentColor"/>\n\
    <feComposite in2="SourceGraphic" operator="in"/>\n\
  </filter>\n\
</svg>';
  else {
    console.error("No default for option "+option);
    return undefined;
  }
}

async function get_option_with_default(option) {
  console.log("get_option_with_default",option);
  var value = await browser.storage.sync.get(option);
  console.log("-- value",value);
  if (value.hasOwnProperty(option))
    return value[option]
  return get_option_default(option);
}

function parse_macros(macros) {
  var lines = macros.split('\n');
  var results = [];
  for (var i=0; i<lines.length; i++) {
    //console.log(lines[i]);
    if (lines[i].trim()=="") continue;
    var split = lines[i].split("=");
    if (split.length<2) {
      console.error("Invalid macro definition "+lines[i]+" (no = sign)");
      return null;
    }
    var name = split.shift().trim();
    if (name.charAt(0)!='\\') {
      console.error("Invalid macro definition "+lines[i]+" (does not start with \\)");
      return null;
    }
    name = name.substr(1);
    var code = split.join("=").trim();
    //console.log("#"+name+"#"+code+"#");
    results.push({name:name, code:code});
  }
  //console.log(results);
  return results;
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
