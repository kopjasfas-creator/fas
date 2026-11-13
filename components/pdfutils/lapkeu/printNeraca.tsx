import moment from "moment";
import { ICategoryOfAccount, IJournalDetail } from "@/libs/IInterfaces";
import { Header } from "../utils";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";

moment.locale("id");

interface IMapping extends IJournalDetail {
  value: number;
}

const generate = (record: INeraca, periode?: string) => {
  const pend = Object.values(
    record.pendapatan.reduce<Record<string, IMapping>>((acc, item) => {
      if (!acc[item.CategoryOfAccount.name]) {
        acc[item.CategoryOfAccount.name] = {
          ...item,
          value: item.credit - item.debit,
        };
      } else {
        acc[item.CategoryOfAccount.name].value += item.credit - item.debit;
      }
      return acc;
    }, {}),
  );
  const beb = Object.values(
    record.beban.reduce<Record<string, IMapping>>((acc, item) => {
      if (!acc[item.CategoryOfAccount.name]) {
        acc[item.CategoryOfAccount.name] = {
          ...item,
          value: item.debit - item.credit,
        };
      } else {
        acc[item.CategoryOfAccount.name].value += item.debit - item.credit;
      }
      return acc;
    }, {}),
  );
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

        .report-column,
        .report-card,
        .report-section {
          min-width: 0;
        }

        .report-column > .text-lg {
          margin-bottom: 5px;
          padding-bottom: 4px;
          border-bottom: 2px solid #334155;
          font-size: 11px !important;
          letter-spacing: 0.05em;
        }

        .report-card {
          margin: 0 0 5px !important;
          padding: 6px 8px !important;
          border: 1px solid #dbe3ec !important;
          border-radius: 4px;
          background: #fff;
        }

        .report-card-title {
          margin-bottom: 3px;
          color: #1e3a5f;
          font-weight: 700;
          font-size: 9px;
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

        .report-row p:last-child,
        .report-total p:last-child,
        .report-card-total span:last-child {
          flex-shrink: 0;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .report-card-total {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 3px;
          padding-top: 4px;
          border-top: 1px solid #cbd5e1;
          font-weight: 700;
          break-inside: avoid;
        }

        .report-total {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 6px;
          padding: 7px 8px;
          border-radius: 4px;
          background: #eaf1f8;
          color: #17365d;
          font-size: 10px !important;
          font-weight: 700;
        }

        .report-section {
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

        .report-summary {
          margin-top: 8px;
          padding: 7px 9px;
          border: 1px solid #b7d5c2;
          border-radius: 4px;
          background: #edf7f0;
          color: #14532d;
          font-weight: 700;
        }

        .report-section .border-b {
          padding: 2px 0;
          border-color: #edf1f5 !important;
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
          "LAPORAN NERACA KEUANGAN",
          process.env.NEXT_PUBLIC_APP_FULLNAME,
          periode
            ? `${moment(periode.split(",")[0]).format("DD-MM-YYYY")} - ${moment(
                periode.split(",")[1],
              ).format("DD-MM-YYYY")}`
            : `Periode yang berakhir pada ${moment().format("DD-MM-YYYY")}`,
          process.env.NEXT_PUBLIC_APP_LOGO,
          process.env.NEXT_PUBLIC_APP_LOGO,
        )}

        <div class="mt-5">
          <div class="report-grid">
            <div class="report-column">
              <p class="font-bold text-lg">ASSET</p>
              ${record.asset.map(
                (d) =>
                  `
                  <div class="report-card">
                    <p class="report-card-title">${d.name}</p>
                    <div>
                      ${d.Childrens.map(
                        (dc) =>
                          `
                          <div key={dc.id}>
                            <div class="report-row">
                              <p>${dc.name}</p>
                              <p class="text-right">
                                ${IDRFormat(
                                  dc.JournalDetails.reduce(
                                    (acc, curr) =>
                                      acc + (curr.debit - curr.credit),
                                    0,
                                  ),
                                )}
                              </p>
                            </div>
                          </div>`,
                      ).join("")}
                    </div>
                    <div class="report-card-total">
                      <span>Total ${d.name}</span>
                      <span class="text-right">
                        ${IDRFormat(
                          d.Childrens.flatMap((dc) => dc.JournalDetails).reduce(
                            (acc, curr) => acc + curr.debit - curr.credit,
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                `,
              )}
              <div class="report-total">
                <p>JUMLAH ASSET</p>
                <p class="text-right">
                  ${IDRFormat(
                    record.asset
                      .flatMap((d) =>
                        d.Childrens.flatMap((dc) => dc.JournalDetails),
                      )
                      .reduce(
                        (acc, curr) => acc + (curr.debit - curr.credit),
                        0,
                      ),
                  )}
                </p>
              </div>
            </div>

            <div class="report-column">
              <p class="font-bold text-lg">KEWAJIBAN DAN MODAL</p>
              ${record.kewajiban.map(
                (d) =>
                  `<div class="report-card">
                  <p class="report-card-title">${d.name}</p>
                  <div>
                    ${d.Childrens.map(
                      (dc) =>
                        `<div key={dc.id}>
                        <div class="report-row">
                          <p>${dc.name}</p>
                          <p class="text-right">
                            ${IDRFormat(
                              dc.JournalDetails.reduce(
                                (acc, curr) => acc + (curr.credit - curr.debit),
                                0,
                              ),
                            )}
                          </p>
                        </div>
                      </div>`,
                    ).join("")}
                  </div>
                  <div class="report-card-total">
                    <span>Total ${d.name}</span>
                    <span class="text-right">
                      ${IDRFormat(
                        d.Childrens.flatMap((dc) => dc.JournalDetails).reduce(
                          (acc, curr) => acc + curr.credit - curr.debit,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>`,
              )}
              ${record.modal.map(
                (d) =>
                  `<div
                  class="report-card"
                >
                  <p class="report-card-title">${d.name}</p>
                  <div>
                    ${d.Childrens.map(
                      (dc) =>
                        `<div key={dc.id}>
                        <div class="report-row">
                          <p>${dc.name}</p>
                          <p class="text-right">
                            ${IDRFormat(
                              dc.JournalDetails.reduce(
                                (acc, curr) => acc + (curr.credit - curr.debit),
                                0,
                              ),
                            )}
                          </p>
                        </div>
                      </div>`,
                    ).join("")}
                  </div>
                  <div class="report-card-total">
                    <span>Total ${d.name}</span>
                    <span class="text-right">
                      ${IDRFormat(
                        d.Childrens.flatMap((dc) => dc.JournalDetails).reduce(
                          (acc, curr) => acc + curr.credit - curr.debit,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>`,
              )}
              <div class="report-total">
                <p>JUMLAH KEWAJIBAN DAN MODAL</p>
                <p class="text-right">
                  ${IDRFormat(
                    [...record.kewajiban, ...record.modal]
                      .flatMap((d) =>
                        d.Childrens.flatMap((dc) => dc.JournalDetails),
                      )
                      .reduce(
                        (acc, curr) => acc + (curr.credit - curr.debit),
                        0,
                      ),
                  )}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

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
            ${pend
              .map(
                (d) =>
                  `<div class="report-row">
                    <p>${d.CategoryOfAccount.name}</p>
                    <p class="text-right">${IDRFormat(d.value)}</p>
                  </div>`,
              )
              .join("")}
            </div>
            <div class="report-card-total">
              <p>TOTAL PENDAPATAN</p>
              <p class="text-right">${IDRFormat(pend.reduce((acc, curr) => acc + curr.value, 0))}</p>
            </div>
          </div>

          <div class="report-section">
            <p class="report-section-title">BEBAN</p>
            <div>
              ${beb
                .map(
                  (d) =>
                    `<div class="report-row">
                    <p>${d.CategoryOfAccount.name}</p>
                    <p class="text-right">${IDRFormat(d.value)}</p>
                  </div>`,
                )
                .join("")}
            </div>
            <div class="report-card-total">
              <p>TOTAL BEBAN</p>
              <p class="text-right">${IDRFormat(beb.reduce((acc, curr) => acc + curr.value, 0))}</p>
            </div>
            <div class="report-summary flex justify-between gap-2">
              <p>SISA HASIL USAHA (SHU)</p>
              <p class="text-right">${IDRFormat(pend.reduce((acc, curr) => acc + curr.value, 0) - beb.reduce((acc, curr) => acc + curr.value, 0))}</p>
            </div>
          </div>
        </div>

      </div>

    </body>
  </html>
  `;

  return html;
};

export const printNeraca = (record: INeraca, periode?: string) => {
  const htmlContent = generate(record, periode);

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

interface INeraca {
  asset: ICategoryOfAccount[];
  kewajiban: ICategoryOfAccount[];
  modal: ICategoryOfAccount[];
  pendapatan: IJournalDetail[];
  beban: IJournalDetail[];
}
