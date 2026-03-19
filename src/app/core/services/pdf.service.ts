import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private html2pdfPromise: Promise<typeof import('html2pdf.js')> | null = null;

  private loadHtml2Pdf(): Promise<typeof import('html2pdf.js')> {
    if (!this.html2pdfPromise) {
      this.html2pdfPromise = import('html2pdf.js');
    }
    return this.html2pdfPromise;
  }

  async generateFromElement(element: HTMLElement, filename: string): Promise<void> {
    const html2pdfModule = await this.loadHtml2Pdf();
    const html2pdf = html2pdfModule.default;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(element).save();
  }

  async generateFromHtml(html: string, filename: string): Promise<void> {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.padding = '20px';
    container.style.maxWidth = '800px';
    container.style.fontFamily = 'Roboto, sans-serif';
    container.style.lineHeight = '1.6';
    container.style.color = '#333';

    // Style tables within the container
    container.querySelectorAll('table').forEach((table) => {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '16px';
    });
    container.querySelectorAll('th, td').forEach((cell) => {
      (cell as HTMLElement).style.border = '1px solid #ddd';
      (cell as HTMLElement).style.padding = '8px';
    });
    container.querySelectorAll('th').forEach((th) => {
      (th as HTMLElement).style.backgroundColor = '#f5f5f5';
      (th as HTMLElement).style.fontWeight = '600';
    });

    // Temporarily append to DOM for rendering
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      await this.generateFromElement(container, filename);
    } finally {
      document.body.removeChild(container);
    }
  }
}
