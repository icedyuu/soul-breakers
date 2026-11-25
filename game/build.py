import glob, os
here = os.path.dirname(os.path.abspath(__file__))
js = "\n".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(here, "src", "*.js"))))
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Soul Breakers</title>
<style>
  html, body {{ margin: 0; height: 100%; background: #05030a; overflow: hidden; }}
  body {{ display: flex; align-items: center; justify-content: center; }}
  canvas {{ display: block; background: #000; image-rendering: auto; outline: none; box-shadow: 0 0 60px rgba(255,40,90,0.25); }}
</style>
</head>
<body>
<canvas id="game" width="1280" height="720" tabindex="0"></canvas>
<script>
{js}
</script>
</body>
</html>
"""
open(os.path.join(here, "dist", "index.html"), "w", encoding="utf-8").write(html)
print("built", len(html), "bytes")
