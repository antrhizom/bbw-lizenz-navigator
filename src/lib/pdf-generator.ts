import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Tool } from "@/data/types";

export function generateLicensePdf(
  tools: Tool[],
  activeFilters: string
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(0, 150, 69);
  doc.text("BBW Lizenz-Navigator", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Filter: ${activeFilters || "Alle Tools"}`,
    14,
    26
  );
  doc.text(
    `Stand: ${new Date().toLocaleDateString("de-CH")} | ${tools.length} Tool${tools.length !== 1 ? "s" : ""}`,
    14,
    32
  );

  // Table
  autoTable(doc, {
    startY: 38,
    head: [
      [
        "Tool",
        "Tooltyp",
        "Lizenzart",
        "KI",
        "Lernende",
        "Lehrpersonen",
        "Funktionen",
      ],
    ],
    body: tools.map((t) => [
      t.name,
      t.typ,
      t.lizenz + (t.lizenzDetail ? ` (${t.lizenzDetail})` : ""),
      t.ki ? "Ja" : "Nein",
      t.lernende ? "Ja" : "Nein",
      t.lp ? "Ja" : "Nein",
      t.funcs,
    ]),
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [0, 150, 69], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [230, 245, 236] },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: "bold" },
      1: { cellWidth: 42 },
      2: { cellWidth: 45 },
      3: { cellWidth: 12 },
      4: { cellWidth: 18 },
      5: { cellWidth: 22 },
      6: { cellWidth: "auto" },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `BBW Winterthur - Lizenz-Navigator | Seite ${i} von ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  doc.save("BBW_Lizenzuebersicht.pdf");
}
