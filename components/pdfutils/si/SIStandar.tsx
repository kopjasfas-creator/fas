import moment from "moment";
import { IDropping } from "@/libs/IInterfaces";
import { Header } from "../utils";
import { GetDetailDapem, IDRFormat } from "@/components/utils/PembiayaanUtil";

moment.locale("id");

const generateSI = (record: IDropping) => {
  const dapemProcessed = record.Dapems.map((curr) => {
    const detail = GetDetailDapem(curr);
    const blokir_sumdan = curr.c_blokir * detail.detail.angsuran_sumdan;
    const blokir_full = curr.c_blokir * detail.angsuran;
    const drop =
      curr.plafond -
      (detail.detail.adm_sumdan +
        detail.detail.provisi_sumdan +
        curr.c_account_sumdan);
    const dropping = record.Sumdan.include_blokir
      ? record.Sumdan.blokir_mitra
        ? drop - blokir_sumdan
        : drop - blokir_full
      : drop;
    return {
      ...curr,
      adm: detail.detail.adm_sumdan,
      provisi: detail.detail.provisi_sumdan,
      blokir_sumdan,
      blokir_full,
      dropping: dropping,
    };
  });

  const totalPlafond = dapemProcessed.reduce(
    (acc, curr) => acc + curr.plafond,
    0,
  );
  const totaladm = dapemProcessed.reduce((acc, curr) => acc + curr.adm, 0);
  const totalprovisi = dapemProcessed.reduce(
    (acc, curr) => acc + curr.provisi,
    0,
  );
  const totalaccount = dapemProcessed.reduce(
    (acc, curr) => acc + curr.c_account_sumdan,
    0,
  );
  const totaldropping = dapemProcessed.reduce(
    (acc, curr) => acc + curr.dropping,
    0,
  );

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }

        html, body {
          height: 100%;
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 14px;
          text-align: justify;
        }

        /* Pemisah halaman */
        .page-break {
          page-break-before: always;
          break-before: page;
          display: block;
          height: 0;
          border: none;
        }
          @media print {
            .page {
              position: relative;
              min-height: 95vh;
              padding-top: 80px;
              page-break-after: always;
            }
    
            .page .page-header {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              padding: 10px;
              text-align: center;
              background: white;
              border-bottom: 1px solid #ccc;
            }
          }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-4 max-w-200">

    <div class="page" style="font-size: 12px;">
      ${Header("PERMOHONAN DROPPING DANA PENCAIRAN", record.id, undefined, process.env.NEXT_PUBLIC_APP_LOGO, record.Sumdan.logo)}

      <div class="my-4">
        <div class="flex gap-3">
          <p class="w-44">No</p>
          <p class="w-4">:</p>
          <p class="flex-1">${record.id}</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">Lampiran</p>
          <p class="w-4">:</p>
          <p class="flex-1">1 (satu) Daftar Permohonan Dropping</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">Perihal</p>
          <p class="w-4">:</p>
          <p class="flex-1">Pormohonan Dropping Dana Pembiayaan Pensiun Periode Bulan ${moment(record.created_at).format("MMM")} Tahun ${moment(record.created_at).format("YYYY")}</p>
        </div>
      </div>

      <div class="mt-4">
        <p>Kepada Yth</p>
        <p class="font-bold">Direktur ${record.Sumdan.name}</p>
        <p>Di tempat</p>
      </div>
      <div class="mt-2">
        <p>Bersama surat ini kami ajukan permohonan pencairan dan pemindahbukuan atas pengajuan yang sudah disetujui oleh komite bank. Adapun rekap dropping tersebut kami sampaikan sebagai berikut :</p>
        
        <div class="mt-4 flex gap-2 ml-3">
          <p class="w-44">Jumlah Debitur</p>
          <p class="w-4">:</p>
          <p class="flex-1">${record.Dapems.length}</p>
        </div>
        <div class="flex gap-2 ml-3">
          <p class="w-44">Jumlah Plafond</p>
          <p class="w-4">:</p>
          <p class="flex-1">Rp. ${IDRFormat(totalPlafond)}</p>
        </div>
        <div class="mb-4 flex gap-2 ml-3">
          <p class="w-44">Jumlah Dropping</p>
          <p class="w-4">:</p>
          <p class="flex-1">Rp. ${IDRFormat(totaldropping)}</p>
        </div>

        <p class="mt-4">Rincian data kami lampirkan bersama surat ini.</p>
        <p>Dana tersebut diatas mohon dapat disetorkan/ditransfer kepada kami melalui :</p>

        <div class="flex gap-2 ml-3">
          <p class="w-44">Nomor Rekening</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NUMBER}</p>
        </div>
        <div class="mt-4 flex gap-2 ml-3">
          <p class="w-44">Atas Nama</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NAME}</p>
        </div>
        <div class="mb-4 flex gap-2 ml-3">
          <p class="w-44">Nama Bank</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_BANK}</p>
        </div>

        <p>Demikian kami sampaikan dan atas perhatian serta kerjasama yang terjalin baik selama ini diucapkan terima kaslh.</p>
      </div>

      <div class="mt-20 flex justify-end">
        <div class="w-96 text-center">
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_CITY}, ${moment(record.created_at).format("DD-MM-YYYY")}</p>
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_NAME?.toUpperCase()}</p>
          <div class="h-28"></div>
          <p class="border-b">${process.env.NEXT_PUBLIC_APP_OPS_NAME}</p>
          <p>${process.env.NEXT_PUBLIC_APP_OPS_POSITION}</p>
        </div>
      </div>

    </div>

    <div class="page" style="font-size: 12px;">
      ${Header("LAMPIRAN PERMOHONAN DROPPING", record.id, undefined, process.env.NEXT_PUBLIC_APP_LOGO, record.Sumdan.logo)}

      <div class="my-4">
        <div class="flex gap-3">
          <p class="w-44">No Surat</p>
          <p class="w-4">:</p>
          <p class="flex-1">${record.id}</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">No Rekening</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NUMBER}</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">Atas Nama</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_BANK}</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">Nama Bank</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NAME}</p>
        </div>
      </div>

      <div class="mt-10">
        <table class="w-full border-collapse border border-gray-400 border-dashed text-sm mb-4">
          <thead>
            <tr class="bg-gray-200">
              <th class="border border-gray-400 border-dashed p-1">NO</th>
              <th class="border border-gray-400 border-dashed p-1">Debitur</th>
              <th class="border border-gray-400 border-dashed p-1">Plafond</th>
              <th class="border border-gray-400 border-dashed p-1">Adm Bank</th>
              <th class="border border-gray-400 border-dashed p-1">Provisi Bank</th>
              <th class="border border-gray-400 border-dashed p-1">Buka Rekening</th>
              ${record.Sumdan.include_blokir ? `<th class="border border-gray-400 border-dashed p-1">Blokir Angsuran</th>` : ""}
              <th class="border border-gray-400 border-dashed p-1">Dropping</th>
            </tr>
          </thead>
          <tbody>
            ${dapemProcessed
              .map(
                (r, i) => `
              <tr>
                <td class="border border-gray-400 border-dashed p-1 text-center">${i + 1}</td>
                <td class="border border-gray-400 border-dashed p-1">
                  <div>${r.Debitur.fullname}</div>
                  <div class="text-xs opacity-70">${r.Debitur.nopen}</div>
                </td>
                <td class="border border-gray-400 border-dashed p-1 text-right">${IDRFormat(r.plafond)}</td>
                <td class="border border-gray-400 border-dashed p-1 text-right">${IDRFormat(r.adm)}</td>
                <td class="border border-gray-400 border-dashed p-1 text-right">${IDRFormat(r.provisi)}</td>
                <td class="border border-gray-400 border-dashed p-1 text-right">${IDRFormat(r.c_account_sumdan)}</td>
                ${record.Sumdan.include_blokir ? `<td class="border border-gray-400 border-dashed p-1 text-right">${IDRFormat(record.Sumdan.blokir_mitra ? r.blokir_sumdan : r.blokir_full)}</td>` : ""}
                <td class="border border-gray-400 border-dashed p-1 text-right">${IDRFormat(r.dropping)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr class="bg-gray-100 font-semibold italic">
              <td colspan="2" class="border border-gray-400 p-2 text-center border-dashed">
                JUMLAH
              </td>
              <td class="border border-gray-400 p-2 text-right border-dashed">
                ${IDRFormat(totalPlafond)}
              </td>
              <td class="border border-gray-400 p-2 text-right border-dashed">
                ${IDRFormat(totaladm)}
              </td>
              <td class="border border-gray-400 p-2 text-right border-dashed">
                ${IDRFormat(totalprovisi)}
              </td>
              <td class="border border-gray-400 p-2 text-right border-dashed">
                ${IDRFormat(totalaccount)}
              </td>
              <td class="border border-gray-400 p-2 text-right border-dashed">
                ${IDRFormat(totaldropping)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="mt-20 flex justify-evenly">
        <div class="w-96 text-center">
          <p>Diproses oleh</p>
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_NAME?.toUpperCase()}</p>
          <div class="h-28"></div>
          <p class="border-b">${process.env.NEXT_PUBLIC_APP_OPS_NAME}</p>
          <p>${process.env.NEXT_PUBLIC_APP_OPS_POSITION}</p>
        </div>
        <div class="w-96 text-center">
          <p>Diperiksa oleh</p>
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_NAME?.toUpperCase()}</p>
          <div class="h-28"></div>
          <p class="border-b">${process.env.NEXT_PUBLIC_APP_ACCOUNTING_NAME}</p>
          <p>${process.env.NEXT_PUBLIC_APP_ACCOUNTING_POSITION}</p>
        </div>
      </div>
    </div>

    </body>
  </html>
  `;

  return html;
};

export const printSIStandar = (record: IDropping) => {
  const htmlContent = generateSI(record);

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
