/**
 * Isolated print utility for ATS-compliant resumes.
 *
 * Spawns an isolated, hidden iframe containing strictly the target resume document,
 * cloning all application stylesheets and fonts while stripping away all
 * surrounding webpage UI (headers, sidebars, buttons, editor panels, backgrounds).
 */
export function printIsolatedElement(element: HTMLElement | null, documentTitle = '') {
  if (!element || typeof window === 'undefined') return;

  // Clean up any stale print iframes
  const existingIframe = document.getElementById('__huntflow_print_frame__');
  if (existingIframe) {
    existingIframe.remove();
  }

  // Create an invisible iframe attached to body
  const iframe = document.createElement('iframe');
  iframe.id = '__huntflow_print_frame__';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback to window.print if iframe context unavailable
    window.print();
    return;
  }

  // Extract all existing CSS link and style tags to maintain typography & layout
  const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  let stylesHtml = '';
  styleNodes.forEach((node) => {
    stylesHtml += node.outerHTML + '\n';
  });

  // Extract inner HTML of the resume sheet
  const resumeHtml = element.innerHTML;

  doc.open();
  doc.write(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title></title>
    ${stylesHtml}
    <style>
      /* Suppress browser default headers (date, title) and footers (URL, page number) */
      @page {
        size: A4 portrait;
        margin: 0mm !important;
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        background-color: #ffffff !important;
        color: #000000 !important;
        font-family: 'Times New Roman', Times, serif;
        font-size: 10pt;
        line-height: 1.3;
        width: 100% !important;
        height: auto !important;
      }
      #print-root {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 12mm 15mm !important; /* Standard Harvard / Jake's ATS Resume margin */
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
        border: none !important;
        box-sizing: border-box !important;
      }
      /* Prevent awkward mid-section breaks across pages */
      .entry-block,
      div > div:has(h2),
      .break-inside-avoid {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      a {
        color: inherit !important;
        text-decoration: none !important;
      }
    </style>
  </head>
  <body>
    <div id="print-root">
      ${resumeHtml}
    </div>
  </body>
</html>
  `);
  doc.close();

  // Give the browser time to parse CSS and fonts before triggering print
  setTimeout(() => {
    try {
      if (doc) {
        doc.title = '';
      }
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print()', e);
      window.print();
    } finally {
      // Clean up iframe after print dialog completes
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  }, 250);
}
