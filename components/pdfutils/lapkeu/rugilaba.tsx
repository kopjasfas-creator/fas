import moment from "moment";
import { ICategoryOfAccount } from "@/libs/IInterfaces";
import { Header } from "../utils";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";

moment.locale("id");

const generate = (
  pendapatan: ICategoryOfAccount[],
  beban: ICategoryOfAccount[],
  periode?: string,
) => {
  const pend = pendapatan
    .flatMap((f) => f.JournalDetails)
    .reduce((acc, curr) => acc + curr.credit - curr.debit, 0);
  const beb = beban
    .flatMap((f) => f.JournalDetails)
    .reduce((acc, curr) => acc + curr.debit - curr.credit, 0);
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page landscapePage {
          size: A4 landscape;
          margin: 7mm;
        }

        @page portraitPage {
          size: A4 portrait;
          margin: 7mm;
        }

        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          line-height: 1.3;
          color: #1f2937;
        }

        .page {
          page-break-after: always;
          padding: 6mm !important;
        }

        .landscape {
          page: landscapePage;
        }

        .portrait {
          page: portraitPage;
        }

        .page:last-child {
          page-break-after: auto;
        }

        .page-header {
          margin-bottom: 10px !important;
          padding-bottom: 8px !important;
          border-color: #cbd5e1 !important;
        }

        .page-header h2 {
          margin-bottom: 3px !important;
          font-size: 15px !important;
          letter-spacing: 0.06em;
        }

        .page-header p {
          font-size: 9px;
          line-height: 1.35;
        }

        .page-header img,
        .page-header .h-16 {
          height: 34px !important;
        }

        .report-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          align-items: start;
        }

        .report-section {
          min-width: 0;
          padding: 8px;
          border: 1px solid #dbe3ec;
          border-radius: 4px;
        }

        .report-section-title {
          margin-bottom: 4px;
          padding-bottom: 4px;
          border-bottom: 1px solid #cbd5e1;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .report-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 2px 0;
          border-bottom: 1px solid #edf1f5;
          break-inside: avoid;
        }

        .report-row p:first-child {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .report-row p:last-child {
          flex-shrink: 0;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .report-total {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 5px;
          padding-top: 4px;
          border-top: 1px solid #cbd5e1;
          font-weight: 700;
          break-inside: avoid;
        }

        .report-summary {
          margin-top: 8px;
          padding: 7px 9px;
          border: 1px solid #b7d5c2;
          border-radius: 4px;
          background: #edf7f0;
          color: #14532d;
          font-weight: 700;
        }

        @media print {
          .page {
            width: 100%;
            min-height: 0;
            height: auto;
          }
        }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed">

      <div class="page landscape p-2">
        ${Header(
          "LAPORAN LABA/RUGI",
          process.env.NEXT_PUBLIC_APP_FULLNAME,
          periode
            ? `${moment(periode.split(",")[0]).format("DD-MM-YYYY")} - ${moment(
                periode.split(",")[1],
              ).format("DD-MM-YYYY")}`
            : `Periode yang berakhir pada ${moment().format("DD-MM-YYYY")}`,
          process.env.NEXT_PUBLIC_APP_LOGO,
          process.env.NEXT_PUBLIC_APP_LOGO,
        )}

        <div class="report-grid">
          <div class="report-section">
            <p class="report-section-title">PENDAPATAN</p>
            <div>
            ${pendapatan
              .map(
                (d) =>
                  `<div class="report-row">
                    <p>${d.name}</p>
                    <p class="text-right">${IDRFormat(d.JournalDetails.reduce((acc, curr) => acc + curr.credit - curr.debit, 0))}</p>
                  </div>`,
              )
              .join("")}
            </div>
            <div class="report-total">
              <p>TOTAL PENDAPATAN</p>
              <p class="text-right">${IDRFormat(pend)}</p>
            </div>
          </div>

          <div class="report-section">
            <p class="report-section-title">BEBAN</p>
            <div>
              ${beban
                .map(
                  (d) =>
                    `<div class="report-row">
                    <p>${d.name}</p>
                    <p class="text-right">${IDRFormat(d.JournalDetails.reduce((acc, curr) => acc + curr.debit - curr.credit, 0))}</p>
                  </div>`,
                )
                .join("")}
            </div>
            <div class="report-total">
              <p>TOTAL BEBAN</p>
              <p class="text-right">${IDRFormat(beb)}</p>
            </div>
            <div class="report-summary flex justify-between gap-2">
              <p>SISA HASIL USAHA (SHU)</p>
              <p class="text-right">${IDRFormat(pend - beb)}</p>
            </div>
          </div>
        </div>

      </div>

    </body>
  </html>
  `;

  return html;
};

export const printRL = (
  pendapatan: ICategoryOfAccount[],
  beban: ICategoryOfAccount[],
  periode?: string,
) => {
  const htmlContent = generate(pendapatan, beban, periode);

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari situs ini.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 200);
  };
};
