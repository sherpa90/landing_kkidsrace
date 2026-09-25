with open("src/views/inscribir.ejs", "r") as f:
    text = f.read()

import re

# 1. Rename downloadTicketAsImage to generateTicketDataUrl and return the dataUrl instead of downloading it
text = text.replace(
    "function downloadTicketAsImage() {",
    "function generateTicketDataUrl() {"
)

text = text.replace(
    """        // Disparar descarga automática
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const firstBib = children[0]?.inscriptionNumber || children[0]?.bibNumber || 'inscripcion';
        link.download = `comprobante-kidsrace-${firstBib}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);""",
    """        return canvas.toDataURL('image/png');"""
)

# 2. Modify btnDownloadTicket listener to trigger download using the generated image
text = text.replace(
    """      const btnDownloadTicket = document.getElementById('btn-download-ticket');
      if (btnDownloadTicket) {
        btnDownloadTicket.addEventListener('click', downloadTicketAsImage);
      }""",
    """      const btnDownloadTicket = document.getElementById('btn-download-ticket');
      if (btnDownloadTicket) {
        btnDownloadTicket.addEventListener('click', () => {
          const img = document.getElementById('ticket-preview-img');
          if (img && img.src) {
            const link = document.createElement('a');
            const firstBib = latestRegistrationResult?.children?.[0]?.inscriptionNumber || 'inscripcion';
            link.download = `comprobante-kidsrace-${firstBib}.png`;
            link.href = img.src;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            window.print();
          }
        });
      }"""
)

# 3. Inside the success logic, call generateTicketDataUrl and set it to the preview img
success_injection = """              if (json.count && json.count > 1) {
                const sTitle = document.getElementById('success-title');
                if (sTitle) sTitle.textContent = `¡${json.count} Inscripciones Confirmadas!`;
              }
              
              // Renderizar y mostrar el comprobante en pantalla
              setTimeout(() => {
                const dataUrl = generateTicketDataUrl();
                if (dataUrl) {
                  const previewImg = document.getElementById('ticket-preview-img');
                  const previewContainer = document.getElementById('ticket-preview-container');
                  if (previewImg && previewContainer) {
                    previewImg.src = dataUrl;
                    previewContainer.classList.remove('hidden');
                  }
                }
              }, 100);"""

text = text.replace(
"""              if (json.count && json.count > 1) {
                const sTitle = document.getElementById('success-title');
                if (sTitle) sTitle.textContent = `¡${json.count} Inscripciones Confirmadas!`;
              }""",
success_injection
)

with open("src/views/inscribir.ejs", "w") as f:
    f.write(text)

