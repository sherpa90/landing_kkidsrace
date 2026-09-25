with open("src/public/js/admin.js", "r") as f:
    text = f.read()

target = """      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {"""

replacement = """      const config = {
        fps: 15,
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.QR_CODE, 
            Html5QrcodeSupportedFormats.PDF_417, 
            Html5QrcodeSupportedFormats.CODE_128, 
            Html5QrcodeSupportedFormats.CODE_39, 
            Html5QrcodeSupportedFormats.EAN_13 
        ],
        qrbox: (viewfinderWidth, viewfinderHeight) => {"""

new_text = text.replace(target, replacement)
with open("src/public/js/admin.js", "w") as f:
    f.write(new_text)

