/**
 * get the section of the parameter tree at the end of "path"
 * @param  {JSON} paramTree the parameter tree
 * @param  {[String]} path the path to the section of the parameter tree that we want
 * @return {JSON}     the section of the parameter tree at the end of 'path'
 */
export function getNested(paramTree, path) {
  try {
    var current = paramTree;
    for (let pathSection of path) {
      var current = current[pathSection];
    }
    return current;
  } catch (err) {
    console.log(err);
    return {};
  }
}

/**
 * return the input string with its first letter capitalized, and all underscores converted to spaces,
 * and spaces added between capitalized words so as to display names more nicely
 * @param {String} str - the string to format
 * @returns {String} - the string, with first letter capitalized, underscores converted to spaces and spaces between capitalized words
 */
export function format_string(str) {
  return str
    .replaceAll("_", " ")
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
    .replace(/([A-Z]+)/g, " $1")
    .trim()
    .replace("/ ", "/");
}

/**
 * remove unnecessary brackets from beginning and end of json, unindent it by num_spaces,
 * then add in the html to colour booleans (blue), strings (brown), numbers (green) and brackets (yellow)
 * @param {String} json_string - the json object passed in as a string
 * @param {Number} num_spaces - the number of spaces used for indenting
 * @returns {String} - the json string, formatted
 */
export function format_json(json_string, num_spaces) {
  var json_formatted = " ".repeat(num_spaces) + json_string.slice(1, -2).trim();
  var json_lines = json_formatted.split("\n");
  for (let i = 0; i < json_lines.length; i++) {
    json_lines[i] = json_lines[i].replace(" ".repeat(num_spaces), "");
  }
  json_formatted = json_lines.join("\n");
  //colour bools
  json_formatted = json_formatted
    .replaceAll("true", "<span class='bool'>true</span>")
    .replaceAll("false", "<span class='bool'>false</span>");
  //colour numbers
  json_formatted = json_formatted.replace(/:\s\d+\.?\d*/g, function (a) {
    return ": <span class='number'>" + a.replace(": ", "") + "</span>";
  });
  json_formatted = json_formatted.replace(/\[([^\[\]]*)\]/g, function (a) {
    return (
      "<span class='number'>" +
      a.replaceAll(",", "</span>,<span class='number'>") +
      "</span>"
    );
  });
  //colour strings
  json_formatted = json_formatted.replace(/"(?:[^"\\]|\\.)*"/g, function (a) {
    return "<span class='string'>" + a + "</span>";
  });
  //colour brackets
  json_formatted = json_formatted
    .replaceAll("{", "<span class='bracket'>{</span>")
    .replaceAll("}", "<span class='bracket'>}</span>");
  json_formatted = json_formatted
    .replaceAll("[", "<span class='bracket'>[</span>")
    .replaceAll("]", "<span class='bracket'>]</span>");
  json_formatted = json_formatted.replaceAll(
    "null",
    "<span class='null'>null</span>"
  );
  return json_formatted;
}
