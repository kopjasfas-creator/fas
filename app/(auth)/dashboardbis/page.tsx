"use client";

import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import {
  IDapem,
  IArea,
  IPageProps,
  ISumdan,
  IUserDapem,
} from "@/libs/IInterfaces";

import {
  App,
  DatePicker,
  Spin,
  Table,
  TableProps,
  Progress,
  Tag,
  Card,
  Button,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  MapPin,
} from "lucide-react";
import * as XLSX from "xlsx";
import moment from "moment";

const { RangePicker } = DatePicker;

type DashboardMocSummary = {
  id: string;
  name: string;
  noa: number;
  plafond: number;
};

type DashboardSpvSummary = {
  id: string;
  name: string;
  mocs: DashboardMocSummary[];
  totalNoa: number;
  totalPlafond: number;
};

type DashboardBranchSummary = {
  id: string;
  name: string;
  supervisors: DashboardSpvSummary[];
};

type DashboardAreaSummary = {
  id: string;
  name: string;
  branches: DashboardBranchSummary[];
};

type DashboardReportAssignment = {
  plafond: number;
  dropping_status: IDapem["dropping_status"];
  AO: { id: string; fullname: string } | null;
  AOCabang: { id: string; fullname: string; cabangId: string } | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [pageProps, setPageProps] = useState<IPageProps<IArea>>({
    page: 1,
    limit: 1000,
    total: 0,
    data: [],
    search: "",
    backdate: "",
  });
  const [sumdan, setSumdan] = useState<ISumdan[]>([]);
  const [reportAssignments, setReportAssignments] = useState<
    DashboardReportAssignment[]
  >([]);
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  const [expandedCabangs, setExpandedCabangs] = useState<string[]>([]);
  const [expandedAOs, setExpandedAOs] = useState<string[]>([]);
  const { message } = App.useApp();

  const toggleArea = (id: string) => {
    setExpandedAreas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const toggleCabang = (id: string) => {
    setExpandedCabangs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const toggleAO = (id: string) => {
    setExpandedAOs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const getActiveAOData = (user: IUserDapem) => {
    if (user?.AOs?.length) return user.AOs;
    if (user?.AOCabangs?.length) return user.AOCabangs;
    if (user?.AOAreas?.length) return user.AOAreas;

    return [];
  };

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      ...(pageProps.backdate && { backdate: pageProps.backdate }),
    });

    try {
      await fetch(`/api?${params.toString()}`, { method: "POST" })
        .then((res) => res.json())
        .then((res) => {
          setPageProps((prev) => ({ ...prev, data: res.area }));
          setSumdan(res.sumdan);
          setReportAssignments(res.reportAssignments);
        });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => getData(), 200);
    return () => clearTimeout(timeout);
  }, [pageProps.backdate]);

  const reportData = useMemo<DashboardAreaSummary[]>(
    () =>
      pageProps.data.map((area) => ({
        id: area.id,
        name: area.name,
        branches: area.Cabangs.map((cabang) => ({
          id: cabang.id,
          name: cabang.name,
          supervisors: cabang.Users.map((user) => {
            const mocs = new Map<string, DashboardMocSummary>();
            reportAssignments
              .filter((dapem) => dapem.AOCabang?.id === user.id)
              .forEach((dapem) => {
                const id = dapem.AO?.id ?? "unassigned";
                const existing = mocs.get(id) ?? {
                  id,
                  name: dapem.AO?.fullname ?? "-",
                  noa: 0,
                  plafond: 0,
                };
                if (
                  dapem.dropping_status === "DISETUJUI" ||
                  dapem.dropping_status === "PROSES"
                ) {
                  existing.noa += 1;
                  existing.plafond += dapem.plafond;
                }
                mocs.set(id, existing);
              });
            const mocList = Array.from(mocs.values());

            return {
              id: user.id,
              name: user.fullname,
              mocs: mocList,
              totalNoa: mocList.reduce((total, moc) => total + moc.noa, 0),
              totalPlafond: mocList.reduce(
                (total, moc) => total + moc.plafond,
                0,
              ),
            };
          }).filter((supervisor) => supervisor.mocs.length > 0),
        })),
      })),
    [pageProps.data, reportAssignments],
  );

  const exportExcel = () => {
    const table: (string | number)[][] = [
      [
        "AREA PELAYANAN",
        "UNIT PELAYANAN",
        "SPV",
        "MOC",
        "NOA",
        "PLAFOND",
        "TOTAL NOA",
        "TOTAL PLAFOND",
      ],
    ];
    const merges: XLSX.Range[] = [];
    let worksheetRow = 1;

    reportData.forEach((area) => {
      const areaStart = worksheetRow;
      area.branches.forEach((branch) => {
        const branchStart = worksheetRow;
        branch.supervisors.forEach((supervisor) => {
          const supervisorStart = worksheetRow;
          supervisor.mocs.forEach((moc, mocIndex) => {
            table.push([
              worksheetRow === areaStart ? area.name : "",
              worksheetRow === branchStart ? branch.name : "",
              mocIndex === 0 ? supervisor.name : "",
              moc.name,
              moc.noa,
              moc.plafond,
              mocIndex === 0 ? supervisor.totalNoa : "",
              mocIndex === 0 ? supervisor.totalPlafond : "",
            ]);
            worksheetRow += 1;
          });
          const supervisorEnd = worksheetRow - 1;
          if (supervisorEnd > supervisorStart) {
            [2, 6, 7].forEach((column) =>
              merges.push({
                s: { r: supervisorStart, c: column },
                e: { r: supervisorEnd, c: column },
              }),
            );
          }
        });
        const branchEnd = worksheetRow - 1;
        if (branchEnd > branchStart) {
          merges.push({
            s: { r: branchStart, c: 1 },
            e: { r: branchEnd, c: 1 },
          });
        }
      });
      const areaEnd = worksheetRow - 1;
      if (areaEnd > areaStart) {
        merges.push({
          s: { r: areaStart, c: 0 },
          e: { r: areaEnd, c: 0 },
        });
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(table);
    worksheet["!merges"] = merges;
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
    ];
    worksheet["!autofilter"] = {
      ref: `A1:H${Math.max(1, worksheetRow)}`,
    };
    for (let row = 1; row < worksheetRow; row += 1) {
      const amountCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })];
      const totalCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })];
      if (amountCell) amountCell.z = "#,##0";
      if (totalCell) totalCell.z = "#,##0";
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Bisnis");
    XLSX.writeFile(
      workbook,
      `Dashboard_Bisnis_${moment().format("YYYYMMDD_HHmm")}.xlsx`,
    );
  };

  const exportPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      message.error("Izinkan pop-up untuk mencetak laporan PDF.");
      return;
    }

    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return entities[character];
      });
    const bodyRows: string[] = [];

    reportData.forEach((area) => {
      const areaRowCount = area.branches.reduce(
        (total, branch) =>
          total +
          branch.supervisors.reduce(
            (supervisorTotal, supervisor) =>
              supervisorTotal + supervisor.mocs.length,
            0,
          ),
        0,
      );
      let firstAreaRow = true;

      area.branches.forEach((branch) => {
        const branchRowCount = branch.supervisors.reduce(
          (total, supervisor) => total + supervisor.mocs.length,
          0,
        );
        let firstBranchRow = true;

        branch.supervisors.forEach((supervisor) => {
          supervisor.mocs.forEach((moc, mocIndex) => {
            const cells = [
              ...(firstAreaRow
                ? [
                    `<td rowspan="${areaRowCount}">${escapeHtml(area.name)}</td>`,
                  ]
                : []),
              ...(firstBranchRow
                ? [
                    `<td rowspan="${branchRowCount}">${escapeHtml(branch.name)}</td>`,
                  ]
                : []),
              ...(mocIndex === 0
                ? [
                    `<td rowspan="${supervisor.mocs.length}">${escapeHtml(supervisor.name)}</td>`,
                  ]
                : []),
              `<td>${escapeHtml(moc.name)}</td>`,
              `<td class="number">${moc.noa}</td>`,
              `<td class="number">${IDRFormat(moc.plafond)}</td>`,
              ...(mocIndex === 0
                ? [
                    `<td class="number" rowspan="${supervisor.mocs.length}">${supervisor.totalNoa}</td>`,
                    `<td class="number" rowspan="${supervisor.mocs.length}">${IDRFormat(supervisor.totalPlafond)}</td>`,
                  ]
                : []),
            ];
            bodyRows.push(`<tr>${cells.join("")}</tr>`);
            firstAreaRow = false;
            firstBranchRow = false;
          });
        });
      });
    });

    printWindow.document.write(`<!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Dashboard Bisnis</title>
          <style>
            @page { size: landscape; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #111; }
            h1 { font-size: 16px; text-align: center; margin: 0 0 16px; }
            table { border-collapse: collapse; width: 100%; font-size: 10px; }
            th, td { border: 1px solid #222; padding: 6px; }
            th { text-align: center; background: #e8edf5; }
            td { vertical-align: middle; text-align: center; }
            .number { text-align: right; white-space: nowrap; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>REKAPITULASI DASHBOARD BISNIS</h1>
          <table>
            <thead>
              <tr>
                <th>AREA PELAYANAN</th>
                <th>UNIT PELAYANAN</th>
                <th>SPV</th>
                <th>MOC</th>
                <th>NOA</th>
                <th>PLAFOND</th>
                <th>TOTAL NOA</th>
                <th>TOTAL PLAFOND</th>
              </tr>
            </thead>
            <tbody>${bodyRows.join("")}</tbody>
          </table>
          <script>
            window.onload = () => { window.focus(); window.print(); };
          </script>
        </body>
      </html>`);
    printWindow.document.close();
  };

  const columns: TableProps<ISumdan>["columns"] = [
    {
      title: "Nama Mitra",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="font-bold text-blue-700">{record.name}</div>
          <Tag color="blue">{record.code}</Tag>
        </div>
      ),
    },
    {
      title: "Pencapaian",
      key: "achievement",
      sorter: (a, b) => {
        const getPlafond = (item: ISumdan) =>
          item.ProdukPembiayaans.flatMap((p) => p.Dapems).reduce(
            (acc, c) => acc + c.plafond,
            0,
          );
        return getPlafond(a) - getPlafond(b);
      },
      render: (_, record) => {
        const total = record.ProdukPembiayaans.flatMap((d) => d.Dapems).reduce(
          (acc, curr) => acc + curr.plafond,
          0,
        );
        const allTotal = sumdan
          .flatMap((s) => s.ProdukPembiayaans)
          .flatMap((s) => s.Dapems)
          .reduce((acc, curr) => acc + curr.plafond, 0);
        const percent = (total / allTotal) * 100 || 0;
        return (
          <div className="min-w-50">
            <div className="flex justify-between font-medium">
              <span>{IDRFormat(total)}</span>
              <span className="text-gray-400 text-xs">
                {record.ProdukPembiayaans.flatMap((r) => r.Dapems).length} NOA
              </span>
            </div>
            <Progress
              percent={parseFloat(percent.toFixed(2))}
              size="small"
              status="active"
              strokeColor="#3b82f6"
            />
          </div>
        );
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg text-white">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                Dashboard Pencapaian
              </h1>
              <p className="text-gray-500">Monitoring wilayah kerja</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RangePicker
              className="rounded-lg h-10 shadow-sm"
              onChange={(_, dateStr) =>
                setPageProps({ ...pageProps, backdate: dateStr })
              }
            />
            <Button icon={<FileSpreadsheet size={16} />} onClick={exportExcel}>
              Excel
            </Button>
            <Button
              icon={<FileText size={16} />}
              onClick={exportPdf}
              type="primary"
            >
              Cetak PDF
            </Button>
          </div>
        </div>

        {/* Areas Section */}
        <div className="space-y-6 mb-8">
          {pageProps.data?.map((area: IArea) => {
            const isAreaExpanded = expandedAreas.includes(area.id);
            const areaNoa = area.Cabangs.flatMap((c) =>
              c.Users.flatMap((u) => getActiveAOData(u)),
            );
            const areaPencapaian = areaNoa.reduce(
              (acc, curr) => acc + curr.plafond,
              0,
            );
            const areaTarget = area.Cabangs.flatMap((c) => c.Users).reduce(
              (acc, curr) => acc + (curr.target || 0),
              0,
            );
            const areaPercent = (areaPencapaian / areaTarget) * 100;

            return (
              <Card
                key={area.id}
                className="shadow-md border-none overflow-hidden"
                styles={{ body: { padding: 0 } }}
              >
                {/* Area Header (Clickable) */}
                <div
                  className="bg-slate-800 p-4 text-white flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-all"
                  onClick={() => toggleArea(area.id)}
                >
                  <div className="flex items-center gap-3">
                    {isAreaExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <MapPin size={16} className="text-blue-400" />{" "}
                        {area.name}
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="hidden md:block text-right">
                      <div className="text-sm font-mono">
                        {IDRFormat(areaPencapaian)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total Progress: {areaPercent.toFixed(1)}%
                      </div>
                    </div>
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      className="border-slate-500 text-slate-200"
                    >
                      {isAreaExpanded ? "Sembunyikan" : "Lihat Cabang"}
                    </Button>
                  </div>
                </div>

                {/* Cabang List (Show/Hide) */}
                {isAreaExpanded && (
                  <div className="p-4 bg-slate-50 space-y-4 animate-in fade-in duration-300">
                    {area.Cabangs.map((cabang) => {
                      const isCabangExpanded = expandedCabangs.includes(
                        cabang.id,
                      );
                      const cabPencapaian = cabang.Users.flatMap((u) =>
                        getActiveAOData(u),
                      ).reduce((a, b) => a + b.plafond, 0);

                      return (
                        <div
                          key={cabang.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                        >
                          {/* Cabang Header */}
                          <div
                            className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleCabang(cabang.id)}
                          >
                            <div className="flex items-center gap-2 font-bold text-gray-700">
                              {isCabangExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                              <Building2 size={16} className="text-gray-400" />
                              {cabang.name}
                            </div>
                            <div className="text-blue-600 font-mono text-sm">
                              {IDRFormat(cabPencapaian)}
                            </div>
                          </div>

                          {/* User/AO List (Show/Hide) */}
                          {isCabangExpanded && (
                            <div className="divide-y divide-gray-100 animate-in slide-in-from-top-1 duration-200">
                              {cabang.Users.map((u) => {
                                const aoData = getActiveAOData(u);
                                const isAOExpanded = expandedAOs.includes(u.id);
                                const userAch = aoData.reduce(
                                  (a, b) => a + b.plafond,
                                  0,
                                );
                                const userPct = (userAch / u.target) * 100;
                                return (
                                  <div key={u.id}>
                                    <div className="p-4 flex flex-wrap md:flex-nowrap justify-between items-center hover:bg-blue-50/50 transition-colors">
                                      <div className="w-full md:w-1/3">
                                        <div className="font-semibold text-gray-800">
                                          {u.fullname}
                                        </div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                          {u.position}
                                        </div>
                                      </div>
                                      <div className="flex-1 px-4 min-w-30">
                                        <Progress
                                          percent={parseFloat(
                                            userPct.toFixed(1),
                                          )}
                                          size="small"
                                          strokeColor={
                                            userPct >= 100
                                              ? "#10b981"
                                              : "#3b82f6"
                                          }
                                        />
                                      </div>
                                      <div className="w-full md:w-1/4 text-right">
                                        <div className="font-mono text-sm font-bold text-slate-700">
                                          {IDRFormat(userAch)}
                                        </div>
                                        <div className="text-[10px] text-gray-400 italic">
                                          Target: {IDRFormat(u.target)}
                                        </div>
                                      </div>
                                      <Button
                                        type="text"
                                        size="small"
                                        disabled={aoData.length === 0}
                                        aria-expanded={isAOExpanded}
                                        onClick={() => toggleAO(u.id)}
                                        className="ml-2 shrink-0"
                                      >
                                        {isAOExpanded ? (
                                          <ChevronUp size={16} />
                                        ) : (
                                          <ChevronDown size={16} />
                                        )}
                                        {aoData.length} Pembiayaan
                                      </Button>
                                    </div>

                                    {isAOExpanded && (
                                      <div className="overflow-x-auto border-t border-gray-100 bg-slate-50 px-4 py-3">
                                        <div className="min-w-150">
                                          <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-3 pb-2 text-xs font-semibold uppercase text-gray-400">
                                            <span>Pemohon</span>
                                            <span>Produk</span>
                                            <span>Plafond</span>
                                            <span>Status</span>
                                          </div>
                                          {aoData.map((dapem) => (
                                            <div
                                              key={dapem.id}
                                              className="grid grid-cols-[2fr_2fr_1fr_1fr] items-center gap-4 rounded-md border border-gray-100 bg-white px-3 py-2 text-sm [&+div]:mt-2"
                                            >
                                              <div>
                                                <div className="font-medium text-gray-800">
                                                  {dapem.Debitur.fullname}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                  {dapem.Debitur.nopen}
                                                </div>
                                              </div>
                                              <div>
                                                <div>
                                                  {dapem.ProdukPembiayaan.name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                  {dapem.JenisPembiayaan.name}
                                                </div>
                                              </div>
                                              <div className="font-mono font-medium">
                                                {IDRFormat(dapem.plafond)}
                                                <div className="text-xs text-gray-400">
                                                  {dapem.tenor} Bulan
                                                </div>
                                              </div>
                                              <Tag color="blue">
                                                {dapem.dropping_status}
                                              </Tag>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Table Summary tetap di bawah */}
        <Card
          title="Rekapitulasi Per Mitra"
          className="shadow-md border-none rounded-xl"
        >
          <Table
            columns={columns}
            dataSource={sumdan}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </div>
    </Spin>
  );
}
