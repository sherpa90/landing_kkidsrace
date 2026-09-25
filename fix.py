import re

with open("src/public/js/admin.js", "r") as f:
    text = f.read()

new_func = """  function extractRutFromBarcode(text) {
    if (!text) return null;
    const clean = text.trim();

    const matchParam = clean.match(/(?:RUN|RUT|run|rut)[=:\\s]*([0-9]{7,8}-?[0-9kK])/);
    if (matchParam && matchParam[1]) return matchParam[1].toUpperCase();

    const matchDirect = clean.match(/(?:^|[^0-9])([0-9]{1,2}(?:\\.?[0-9]{3}){2}-?[0-9kK])(?:$|[^0-9a-zA-Z])/);
    if (matchDirect && matchDirect[1]) return matchDirect[1].toUpperCase();

    const matchRaw = clean.match(/(?:^|[^0-9])([0-9]{7,8}[0-9kK])(?:$|[^0-9a-zA-Z])/);
    if (matchRaw && matchRaw[1]) {
      const r = matchRaw[1].toUpperCase();
      return r.slice(0, -1) + '-' + r.slice(-1);
    }

    return null;
  }"""

# find start and end
start_idx = text.find("  function extractRutFromBarcode(text) {")
end_idx = text.find("  }", start_idx) + 3

new_text = text[:start_idx] + new_func + text[end_idx:]

with open("src/public/js/admin.js", "w") as f:
    f.write(new_text)

