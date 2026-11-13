"use client";

import { FormInput } from "@/components";
import {
  GetDetailDapem,
  GetFullAge,
  getInitialDapemDetail,
  GetMaxPlafond,
  GetMaxTenor,
  IDRFormat,
  IDRToNumber,
} from "@/components/utils/PembiayaanUtil";
import {
  IDapem,
  IDebitur,
  IOutputDapemDetail,
  ISumdan,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  BankOutlined,
  HistoryOutlined,
  PrinterOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type {
  Debitur,
  JenisPembiayaan,
  ProdukPembiayaan,
  Sumdan,
} from "../../../generated/prisma/client";
import {
  App,
  Button,
  Card,
  Input,
  Modal,
  notification,
  Select,
  Tooltip,
} from "antd";
import moment from "moment";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const [tglLahirStr, setTglLahirStr] = useState("");
  const [data, setData] = useState<IDapemSimulasi>(defaultData);
  const [jenis, setJenis] = useState<JenisPembiayaan[]>([]);
  const [sumdan, setSumdan] = useState<ISumdan[]>([]);
  const [sumdanAv, setSumdanAv] = useState<ISumdan[]>([]);
  const [details, setDetails] = useState<IOutputDapemDetail>(
    getInitialDapemDetail,
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { hasAccess } = useAccess(pathname || "/simulasi");
  const { message } = App.useApp();

  useEffect(() => {
    const { year, month } = GetFullAge(data.Debitur.birthdate, data.created_at);
    const newAv = sumdan.map((s) => {
      const prod = s.ProdukPembiayaans.filter(
        (p) => year >= p.min_age && year < p.max_age,
      );
      return { ...s, ProdukPembiayaans: prod };
    });
    setSumdanAv(newAv);
    if (
      data.produkPembiayaanId &&
      newAv.flatMap((a) => a.ProdukPembiayaans).length === 0
    ) {
      message.error("Produk tidak tersedia!");
      setData({
        ...defaultData,
        Debitur: {
          birthdate: data.Debitur.birthdate,
        } as IDebitur,
        created_at: data.created_at,
        salary: data.salary,
      });
      return;
    }
    const tempProduk = newAv.flatMap((a) => a.ProdukPembiayaans);
    if (
      tempProduk.length === 1 &&
      tempProduk[0].id !== data.produkPembiayaanId
    ) {
      const findSumdan = newAv.find(
        (s) => s.id === tempProduk[0].sumdanId,
      ) as Sumdan;
      const find = tempProduk[0];
      setData((prev) => ({
        ...prev,
        produkPembiayaanId: find.id,
        ProdukPembiayaan: find,
        Sumdan: findSumdan,
        c_margin_sumdan: find.c_margin_sumdan,
        c_adm_sumdan: findSumdan.c_adm_sumdan,
        c_provisi_sumdan: findSumdan.c_provisi_sumdan,
        c_account_sumdan: findSumdan.c_account_sumdan,
        c_margin: find.c_margin,
        c_adm: findSumdan.c_adm,
        c_provisi: findSumdan.c_provisi,
        c_insurance: find.c_insurance,
        c_gov: findSumdan.c_gov,
        c_stamp: findSumdan.c_stamps,
        c_flagging: findSumdan.c_flagging,
        c_infomation: findSumdan.c_information,
        rounded: findSumdan.rounded,
        fee_banpot: findSumdan.fee_banpot,
        c_ned: findSumdan.c_ned,
      }));
    }
    const maxTenn = GetMaxTenor(data.ProdukPembiayaan.max_paid, year, month);
    const maxTen =
      parseInt(String(maxTenn)) > data.ProdukPembiayaan.max_tenor
        ? data.ProdukPembiayaan.max_tenor
        : parseInt(String(maxTenn));
    const maxPlaff = parseInt(
      String(
        GetMaxPlafond(
          data.c_margin + data.c_margin_sumdan,
          data.tenor,
          ((data.salary - 100000) * data.Sumdan.dsr) / 100,
        ),
      ),
    );

    const maxPlaf =
      maxPlaff > data.ProdukPembiayaan.max_plafond
        ? data.ProdukPembiayaan.max_plafond
        : maxPlaff;

    const detailDapem = GetDetailDapem(data);
    setDetails(detailDapem);

    if (
      detailDapem.detail.angsuranrounded >
      data.salary * (data.Sumdan.dsr / 100)
    ) {
      message.error(
        "Angsuran lebih dari 95%, mohon sesuaikan kembali pembiayaan!",
      );
      setData((prev) => ({ ...prev, plafond: 0 }));
      return;
    }
    setData((prev) => ({
      ...prev,
      max_tenor: maxTen,
      max_plafond: maxPlaf,
      tenor: prev.tenor > maxTen ? maxTen : prev.tenor,
      plafon: prev.plafond > maxPlaf ? maxPlaf : prev.plafond,
    }));
  }, [
    data.created_at,
    data.plafond,
    data.tenor,
    data.Debitur.birthdate,
    data.salary,
    data.margin_type,
    data.ProdukPembiayaan,
    data.c_margin_sumdan,
    data.c_adm_sumdan,
    data.c_provisi_sumdan,
    data.c_account_sumdan,
    data.c_adm,
    data.c_insurance,
    data.c_provisi,
    data.c_gov,
    data.c_stamp,
    data.c_flagging,
    data.c_infomation,
    data.c_mutasi,
    data.c_blokir,
    data.c_fee_bpp,
    data.c_margin,
    data.fee_banpot,
    data.c_takeover,
    data.c_ned,
  ]);

  useEffect(() => {
    if (data.Debitur.birthdate) {
      setTglLahirStr(moment(data.Debitur.birthdate).format("DD/MM/YYYY"));
    }
  }, [data.Debitur.birthdate]);
  const autoFormatDate = (val: string) => {
    const v = val.replace(/\D/g, ""); // Hanya izinkan angka
    if (v.length <= 2) return v;
    if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
  };

  const handleSearch = async () => {
    setLoading(true);
    await fetch("/api/debitur?nopen=" + data.nopen, { method: "PATCH" })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          setData({
            ...data,
            salary: res.data.salary,
            Debitur: { ...data.Debitur, ...res.data },
          });
        }
      });
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetch("/api/jenis?limit=100")
          .then((res) => res.json())
          .then((res) => setJenis(res.data)),
        fetch("/api/sumdan?limit=500&includes=true&includeproduct=true")
          .then((res) => res.json())
          .then((res) => setSumdan(res.data)),
      ]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row">
      <Card
        loading={loading}
        style={{ flex: 1 }}
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 12, padding: 0 },
        }}
      >
        <FormInput
          data={{
            label: "Tanggal Simulasi",
            type: "date",
            mode: "vertical",
            class: "flex-1",
            disabled: !hasAccess("update") || !hasAccess("deviasi"),
            value: moment(data.created_at).format("YYYY-MM-DD"),
            onChange: (e: string) =>
              setData({ ...data, created_at: new Date(e) }),
          }}
        />
        <div className="flex gap-2 flex-wrap">
          <FormInput
            data={{
              label: "Nomor Pensiun",
              type: "text",
              mode: "vertical",
              class: "flex-1",
              value: data.nopen,
              onChange: (e: string) => setData({ ...data, nopen: e }),
              suffix: (
                <Button
                  size="small"
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={loading}
                  onClick={() => handleSearch()}
                ></Button>
              ),
            }}
          />
          <FormInput
            data={{
              label: "Nama Lengkap",
              type: "text",
              mode: "vertical",
              class: "flex-1",
              value: data.Debitur.fullname,
              onChange: (e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, fullname: e } }),
            }}
          />
          <FormInput
            data={{
              label: "Tanggal Lahir",
              type: "text",
              mode: "vertical",
              class: "flex-1",
              value: tglLahirStr,
              onChange: (e: string) => {
                // 1. Format text secara visual
                const formatted = autoFormatDate(e);
                setTglLahirStr(formatted);

                // 2. Update data tanggal UTAMA hanya ketika input sudah lengkap (10 karakter)
                if (formatted.length === 10) {
                  const parsedDate = moment(formatted, "DD/MM/YYYY");
                  if (parsedDate.isValid()) {
                    setData({
                      ...data,
                      Debitur: {
                        ...data.Debitur,
                        birthdate: parsedDate.toDate(),
                      },
                    });
                  }
                }
              },
            }}
          />
          {data.Debitur.birthdate &&
            (() => {
              const { year, month, day } = GetFullAge(
                data.Debitur.birthdate,
                data.created_at,
              );
              return (
                <div className="w-full">
                  <p>Usia Pemohon</p>
                  <div className="flex gap-2">
                    <Input
                      disabled
                      style={{ color: "black" }}
                      value={year}
                      suffix={
                        <span className="text-xs italic opacity-70">Thn</span>
                      }
                    />
                    <Input
                      disabled
                      style={{ color: "black" }}
                      value={month}
                      suffix={
                        <span className="text-xs italic opacity-70">Bln</span>
                      }
                    />
                    <Input
                      disabled
                      style={{ color: "black" }}
                      value={day}
                      suffix={
                        <span className="text-xs italic opacity-70">Hr</span>
                      }
                    />
                  </div>
                </div>
              );
            })()}
          <FormInput
            data={{
              label: "Gaji Pensiun",
              type: "text",
              mode: "vertical",
              class: "flex-1",
              value: IDRFormat(data.salary),
              onChange: (e: string) =>
                setData({
                  ...data,
                  salary: IDRToNumber(e || "0"),
                }),
            }}
          />
          <FormInput
            data={{
              label: "Jenis Pembiayaan",
              type: "select",
              mode: "vertical",
              class: "flex-1",
              options: jenis.map((j) => ({ label: j.name, value: j.id })),
              value: data.jenisPembiayaanId,
              onChange: (e: string) => {
                const find = jenis.find((f) => f.id === e);
                if (find) {
                  setData({
                    ...data,
                    JenisPembiayaan: find,
                    c_mutasi: find.c_mutasi,
                    c_blokir: find.c_blokir,
                    jenisPembiayaanId: find.id,
                  });
                }
              },
            }}
          />
          <div className="w-full">
            <p>Produk Pembiayaan</p>
            <Select
              className="w-full"
              options={sumdanAv.map((j) => ({
                label: j.name,
                options: j.ProdukPembiayaans.map((p) => ({
                  label: `${p.name}`,
                  value: p.id,
                })),
              }))}
              value={data.produkPembiayaanId}
              onChange={(e: string) => {
                const find = sumdan
                  .flatMap((s) => s.ProdukPembiayaans)
                  .find((f) => f.id === e);
                if (find) {
                  const findSumdan = sumdan.find((s) => s.id === find.sumdanId);
                  if (findSumdan) {
                    setData({
                      ...data,
                      Sumdan: findSumdan as Sumdan,
                      ProdukPembiayaan: find,
                      produkPembiayaanId: find.id,
                      c_margin_sumdan: find.c_margin_sumdan,
                      c_margin: find.c_margin,
                      c_adm_sumdan: findSumdan.c_adm_sumdan,
                      c_adm: findSumdan.c_adm,
                      c_provisi_sumdan: findSumdan.c_provisi_sumdan,
                      c_account_sumdan: findSumdan.c_account_sumdan,
                      c_gov: findSumdan.c_gov,
                      c_provisi: findSumdan.c_provisi,
                      c_stamp: findSumdan.c_stamps,
                      c_flagging: findSumdan.c_flagging,
                      c_infomation: findSumdan.c_information,
                      c_insurance: find.c_insurance,
                      rounded: findSumdan.rounded,
                      c_ned: findSumdan.c_ned,
                      fee_banpot: findSumdan.fee_banpot,
                    });
                  }
                }
              }}
              allowClear
            />
          </div>
          {hasAccess("deviasi") ? (
            <div className="w-full flex gap-2">
              <div className="flex-1">
                <div>Margin Sumdan</div>
                <div>
                  <Input
                    value={data.c_margin_sumdan || 0}
                    type="number"
                    onChange={(e) =>
                      setData({
                        ...data,
                        c_margin_sumdan: parseFloat(
                          e.target.value.toString() || "0",
                        ),
                      })
                    }
                    hidden={!hasAccess("deviasi")}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div>Margin Koperasi</div>
                <div>
                  <Input
                    value={data.c_margin || 0}
                    type="number"
                    onChange={(e) =>
                      setData({
                        ...data,
                        c_margin: parseFloat(e.target.value.toString() || "0"),
                      })
                    }
                    hidden={!hasAccess("deviasi")}
                  />
                </div>
              </div>
            </div>
          ) : (
            <FormInput
              data={{
                label: "Margin",
                type: "number",
                mode: "vertical",
                class: `flex-1`,
                value: data.c_margin + data.c_margin_sumdan,
                disabled: true,
                hidden: true,
              }}
            />
          )}
          <div className="w-full bg-gray-800 text-gray-50 p-2 rounded">
            Rekomendasi Pembiayaan
          </div>
          <div className="w-full flex gap-2">
            <div className="flex-1">
              <div>Tenor</div>
              <Input
                value={data.tenor || 0}
                type="number"
                onChange={(e) =>
                  setData({ ...data, tenor: Number(e.target.value || 0) })
                }
              />
            </div>
            <div className="flex-1">
              <div>Max Tenor</div>
              <Input value={data.max_tenor} type="number" disabled />
            </div>
          </div>
          <div className="w-full flex gap-2">
            <div className="flex-1">
              <div>Plafond</div>
              <Input
                value={IDRFormat(data.plafond || 0)}
                onChange={(e) =>
                  setData({
                    ...data,
                    plafond: IDRToNumber(e.target.value || "0"),
                  })
                }
              />
            </div>
            <div className="flex-1">
              <div>Max Plafond</div>
              <Input value={IDRFormat(data.max_plafond || 0)} disabled />
            </div>
          </div>
          <div className="flex-1 flex gap-2">
            <div className="flex-1">
              <div>Angsuran</div>
              <Input
                value={IDRFormat(details.detail.angsuranrounded || 0)}
                disabled
              />
            </div>
            <div className="flex-1">
              <div>Max Angsuran</div>
              <Input
                value={IDRFormat((data.salary * data.Sumdan.dsr) / 100 || 0)}
                disabled
              />
            </div>
          </div>
        </div>
      </Card>
      <Card
        loading={loading}
        style={{ flex: 1 }}
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 12, padding: 0 },
        }}
      >
        <div className="w-full bg-red-500 text-gray-50 p-2 rounded mb-1">
          Rincian Biaya
        </div>
        {hasAccess("deviasi") ? (
          <>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Administrasi</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Tooltip title="Sumdan">
                  <Input
                    size="small"
                    style={{ flex: 1, minWidth: 50 }}
                    value={data.c_adm_sumdan}
                    type={"number"}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        c_adm_sumdan: parseFloat(e.target.value || "0"),
                      }))
                    }
                  />
                </Tooltip>
                <Tooltip title="Koperasi">
                  <Input
                    size="small"
                    style={{ flex: 1, minWidth: 50 }}
                    value={data.c_adm}
                    type={"number"}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        c_adm: parseFloat(e.target.value || "0"),
                      }))
                    }
                  />
                </Tooltip>
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(details.administrasi)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Asuransi</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Input
                  size="small"
                  style={{ flex: 1, minWidth: 50 }}
                  value={data.c_insurance}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_insurance: parseFloat(e.target.value || "0"),
                    }))
                  }
                  type={"number"}
                />
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(details.asuransi)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Tatalaksana</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Input
                  size="small"
                  value={IDRFormat(data.c_gov || 0)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_gov:
                        IDRToNumber(e.target.value || "0") > data.Sumdan.max_bpp
                          ? data.Sumdan.max_bpp
                          : IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Buka Rekening</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Input
                  size="small"
                  value={IDRFormat(data.c_account_sumdan)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c_account_sumdan: IDRToNumber(e.target.value || "0"),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Materai</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Input
                  size="small"
                  value={IDRFormat(data.c_stamp)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_stamp: IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Data Informasi</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Input
                  size="small"
                  value={IDRFormat(data.c_infomation || 0)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_infomation: IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Provisi</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Tooltip title="Sumdan">
                  <Input
                    size="small"
                    style={{ flex: 1, minWidth: 50 }}
                    value={IDRFormat(data.c_provisi_sumdan || 0)}
                    type={"number"}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        c_provisi_sumdan:
                          Number(e.target.value) > 100
                            ? IDRToNumber(e.target.value || "0")
                            : parseFloat(e.target.value || "0"),
                      }))
                    }
                  />
                </Tooltip>
                <Tooltip title="Koperasi">
                  <Input
                    size="small"
                    style={{ flex: 1, minWidth: 50 }}
                    value={IDRFormat(data.c_provisi || 0)}
                    type={"number"}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        c_provisi:
                          Number(e.target.value) > 100
                            ? IDRToNumber(e.target.value || "0")
                            : parseFloat(e.target.value || "0"),
                      }))
                    }
                  />
                </Tooltip>
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(details.provisi)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200 flex-wrap">
              <div className="w-[150]">Mutasi</div>
              <div className="flex-1 flex gap-2 justify-end">
                <Input
                  size="small"
                  value={IDRFormat(data.c_mutasi || 0)}
                  style={{ textAlign: "right", color: "black", width: 130 }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_mutasi: IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
              <div className="flex-1">Biaya Administrasi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  style={{ width: 80 }}
                  disabled
                  suffix={<span className="text-xs italic opacity-70">%</span>}
                  value={data.c_adm + data.c_adm_sumdan}
                  type={"number"}
                  // hidden={!hasAccess("showpercent")}
                  hidden={true}
                />
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(details.administrasi)}
                  style={{ textAlign: "right", color: "black" }}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
              <div className="flex-1">Biaya Asuransi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  style={{ width: 80 }}
                  disabled={!hasAccess("update")}
                  suffix={<span className="text-xs italic opacity-70">%</span>}
                  value={data.c_insurance}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_insurance: Number(e.target.value || "0"),
                    }))
                  }
                  type={"number"}
                  hidden={!hasAccess("showpercent")}
                />
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(details.asuransi)}
                  style={{ textAlign: "right", color: "black" }}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
              <div className="flex-1">Biaya Tatalaksana</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  disabled={!hasAccess("update")}
                  value={IDRFormat(data.c_gov || 0)}
                  style={{ textAlign: "right", color: "black" }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_gov:
                        IDRToNumber(e.target.value || "0") > data.Sumdan.max_bpp
                          ? data.Sumdan.max_bpp
                          : IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
              <div className="flex-1">Biaya Buka Rekening</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  disabled={!hasAccess("update")}
                  value={IDRFormat(data.c_account_sumdan)}
                  style={{ textAlign: "right", color: "black" }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_account_sumdan: IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
            <div
              className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200"
              hidden
            >
              <div className="flex-1">Biaya Metarai</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  disabled={!hasAccess("update")}
                  value={IDRFormat(data.c_stamp)}
                  style={{ textAlign: "right", color: "black" }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_stamp: IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
              <div className="flex-1">Biaya Data Informasi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  disabled={!hasAccess("update")}
                  value={IDRFormat(data.c_infomation || 0)}
                  style={{ textAlign: "right", color: "black" }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_infomation: IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
              <div className="flex-1">Biaya Provisi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  style={{ width: 80 }}
                  disabled
                  suffix={<span className="text-xs italic opacity-70">%</span>}
                  value={data.c_provisi + data.c_provisi_sumdan}
                  type={"number"}
                  // hidden={!hasAccess("showpercent")}
                  hidden={true}
                />
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(details.provisi)}
                  style={{ textAlign: "right", color: "black" }}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
              <div className="flex-1">Biaya Mutasi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  disabled={!hasAccess("update")}
                  value={IDRFormat(data.c_mutasi || 0)}
                  style={{ textAlign: "right", color: "black" }}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      c_mutasi: IDRToNumber(e.target.value || "0"),
                    }))
                  }
                />
              </div>
            </div>
          </>
        )}
        <div className="flex gap-3 justify-between items-center py-2 font-bold text-red-500 border-t border-slate-200 mt-3">
          <div className="flex-1">Total Biaya</div>
          <div className="text-right">{IDRFormat(details.biaya)}</div>
        </div>
        <div className="w-full bg-green-700 text-gray-50 p-2 rounded mb-1">
          Ringkasan Penerimaan
        </div>
        <div className="flex gap-3 justify-between items-center py-2 border-b border-dashed border-slate-200">
          <div className="flex-1">Blokir Angsuran</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              style={{ width: 100 }}
              suffix={<span className="text-xs italic opacity-70">x</span>}
              value={data.c_blokir}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  c_blokir: IDRToNumber(e.target.value || "0"),
                }))
              }
              type={"number"}
            />
            <Input
              size="small"
              disabled
              value={IDRFormat(data.c_blokir * details.angsuran || 0)}
              style={{ textAlign: "right", color: "black" }}
            />
          </div>
        </div>
        <div className="flex gap-3 justify-between items-center py-2 font-bold text-blue-500 border-b border-dashed border-slate-200">
          <div className="flex-1">Terima Kotor</div>
          <div className="text-right">{IDRFormat(details.tk)}</div>
        </div>
        <div className="flex gap-3 justify-between items-center py-2 text-red-500 border-b border-dashed border-slate-200">
          <div className="flex-1">Nominal Pelunasan</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              value={IDRFormat(data.c_takeover || 0)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  c_takeover: IDRToNumber(e.target.value || "0"),
                }))
              }
            />
          </div>
        </div>
        <div className="flex gap-3 justify-between items-center py-2 font-bold text-green-500 border-t border-slate-200 mt-3">
          <div className="flex-1">Terima Bersih</div>
          <div className="text-right">{IDRFormat(details.tb)}</div>
        </div>
        <div className="mt-5 flex justify-between">
          <Button
            danger
            icon={<HistoryOutlined />}
            onClick={() => setData(defaultData)}
          >
            Reset
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => setOpen(true)}
          >
            Cetak
          </Button>
        </div>
      </Card>
      <ModalDetailPembiayaan
        data={data}
        setOpen={setOpen}
        open={open}
        detail={details}
      />
    </div>
  );
}

const ModalDetailPembiayaan = ({
  data,
  open,
  setOpen,
  detail,
}: {
  data: IDapemSimulasi;
  open: boolean;
  setOpen: Function;
  detail: IOutputDapemDetail;
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const maturityDate = moment(data.created_at).add(data.tenor, "month");
  const applicantAge = GetFullAge(data.Debitur.birthdate, data.created_at);
  const maturityAge = GetFullAge(data.Debitur.birthdate, maturityDate.toDate());
  const monthlyDbr =
    data.salary > 0 ? (detail.detail.angsuranrounded / data.salary) * 100 : 0;
  const printMoney = (value: number) => `Rp ${IDRFormat(value || 0)}`;

  const handleSave = async () => {
    try {
      await fetch("/api/simulasi", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          fullname: data.Debitur.fullname,
          birtdate: data.Debitur.birthdate,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status === 201) {
            notification.success({ title: res.msg });
            window.location.reload();
          } else {
            notification.error({ title: res.msg });
          }
        })
        .catch((err) => {
          notification.error({
            title: "ERROR",
            message: err.msg || err.response.message || err.response.msg,
          });
        });
    } catch (err) {
      console.error("Gagal menyimpan simulasi", err);
    }
  };
  const handleDownloadImage = async () => {
    if (printRef.current === null) return;

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `Analisa-${data.Debitur.fullname || "Pembiayaan"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload gambar", err);
    }
  };
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      width={1100}
      style={{ top: 8, maxWidth: "calc(100vw - 15px)" }}
      styles={{
        body: {
          // maxHeight: "calc(100vh - 58px)",
          // overflowY: "auto",
          // padding: 12,
        },
      }}
    >
      <div
        ref={printRef}
        className="simulasi-print-sheet bg-[#f8fafc] p-3 sm:p-4"
        style={{
          color: "#17243b",
          // fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          className="simulasi-print-header flex flex-col items-start justify-between sm:flex-row sm:items-center"
          style={{
            gap: 12,
            paddingBottom: 5,
            borderBottom: "2px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "grid",
                width: 36,
                height: 36,
                flexShrink: 0,
                placeItems: "center",
                borderRadius: 10,
                background: "#eaf2ff",
                color: "#2563eb",
              }}
            >
              {process.env.NEXT_PUBLIC_APP_LOGO ? (
                <Image
                  src={process.env.NEXT_PUBLIC_APP_LOGO}
                  alt="Logo perusahaan"
                  width={32}
                  height={32}
                  unoptimized
                  crossOrigin="anonymous"
                  style={{ objectFit: "contain", padding: 4 }}
                />
              ) : (
                <BankOutlined />
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                }}
              >
                ANALISA PERHITUNGAN
              </div>
              <div style={{ marginTop: 2, color: "#64748b", fontSize: 12 }}>
                Ringkasan simulasi dan estimasi pembiayaan
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "6px 9px",
              borderRadius: 8,
              background: "#eef2ff",
              color: "#3730a3",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Tanggal simulasi: {moment(data.created_at).format("DD-MM-YYYY")}
          </div>
        </div>

        <div
          className="simulasi-print-columns grid grid-cols-1 items-start md:grid-cols-2"
          style={{
            gap: 10,
            marginTop: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrintPanel title="Data Pembiayaan">
              <PrintDataRow label="Nomor Pensiun" value={data.nopen || "-"} />
              <PrintDataRow
                label="Nama Pemohon"
                value={data.Debitur.fullname || "-"}
              />
              <PrintDataRow
                label="Gaji Pensiun"
                value={printMoney(data.salary)}
                emphasis="positive"
              />
              <PrintDataRow
                label="Tanggal Lahir"
                value={moment(data.Debitur.birthdate).format("DD-MM-YYYY")}
              />
              <PrintDataRow
                label="Usia Pemohon"
                value={`${applicantAge.year} Tahun ${applicantAge.month} Bulan`}
              />
              <PrintDataRow
                label="Jenis Pembiayaan"
                value={data.JenisPembiayaan.name || "-"}
              />
              <PrintDataRow
                label="Produk Pembiayaan"
                value={`${data.ProdukPembiayaan.name || "-"}${data.Sumdan.code ? ` (${data.Sumdan.code})` : ""}`}
              />
              <PrintDataRow label="Tenor" value={`${data.tenor} bulan`} />
              <PrintDataRow label="Plafond" value={printMoney(data.plafond)} />
              <PrintDataRow
                label="Margin"
                value={`${(data.c_margin + data.c_margin_sumdan).toFixed(2)}%`}
              />
              <PrintDataRow
                label="Angsuran"
                value={printMoney(detail.angsuran)}
                emphasis="strong"
              />
              <PrintDataRow
                label="Sisa Gaji"
                value={printMoney(data.salary - detail.angsuran)}
                emphasis="positive"
              />
              <PrintDataRow
                label="DBR / Batas"
                value={`${monthlyDbr.toFixed(2)}% / ${data.Sumdan.dsr || 0}%`}
                last
              />
              <PrintDataRow
                label="Tanggal Estimasi Lunas"
                value={maturityDate.format("DD-MM-YYYY")}
              />
              <PrintDataRow
                label="Usia Saat Lunas"
                value={`${maturityAge.year} Tahun ${maturityAge.month} Bulan`}
              />
            </PrintPanel>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrintPanel title="Rincian Pembiayaan">
              <PrintDataRow
                label="Biaya Administrasi"
                value={printMoney(detail.administrasi)}
              />
              <PrintDataRow
                label="Biaya Asuransi"
                value={printMoney(detail.asuransi)}
              />
              <PrintDataRow
                label="Biaya Tatalaksana"
                value={printMoney(data.c_gov)}
              />
              <PrintDataRow
                label="Biaya Buka Rekening"
                value={printMoney(data.c_account_sumdan)}
              />
              <PrintDataRow
                label="Biaya Materai"
                value={printMoney(data.c_stamp)}
              />
              <PrintDataRow
                label="Biaya Provisi"
                value={printMoney(detail.provisi)}
              />
              <PrintDataRow
                label="Biaya Data Informasi"
                value={printMoney(data.c_infomation)}
              />
              <PrintDataRow
                label="Biaya Mutasi"
                value={printMoney(data.c_mutasi)}
              />
              <PrintDataRow
                label="Biaya BPP"
                value={printMoney(data.c_fee_bpp)}
              />
              <PrintDataRow
                label="Total Biaya"
                value={printMoney(detail.biaya)}
                emphasis="negative"
                last
              />
            </PrintPanel>

            <PrintPanel title="Ringkasan Penerimaan">
              <PrintDataRow
                label={`Blokir ${data.c_blokir}x Angsuran`}
                value={printMoney(data.c_blokir * detail.angsuran)}
              />
              <PrintDataRow
                label="Terima Kotor"
                value={printMoney(detail.tk)}
              />
              <PrintDataRow
                label="Nominal Pelunasan"
                value={printMoney(data.c_takeover)}
              />
              <PrintDataRow
                label="Terima Bersih"
                value={printMoney(detail.tb)}
                emphasis="net"
                last
              />
            </PrintPanel>
          </div>
        </div>
      </div>
      <div
        className="flex justify-end gap-2"
        style={{
          position: "sticky",
          bottom: -12,
          zIndex: 1,
          margin: "0 -12px -12px",
          padding: "8px 12px",
          background: "#fff",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <Button icon={<SaveOutlined />} onClick={() => handleSave()}>
          Simpan
        </Button>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handleDownloadImage}
        >
          Cetak
        </Button>
      </div>
    </Modal>
  );
};

const PrintPanel = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      background: "#fff",
    }}
  >
    <div
      style={{
        padding: "6px 10px",
        background: "#16a765",
        color: "#fff",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {title}
    </div>
    <div style={{ padding: "2px 10px" }}>{children}</div>
  </div>
);

const PrintDataRow = ({
  label,
  value,
  emphasis,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: "positive" | "negative" | "strong" | "net";
  last?: boolean;
}) => {
  const valueColor =
    emphasis === "positive" || emphasis === "net"
      ? "#15803d"
      : emphasis === "negative"
        ? "#dc2626"
        : "#334155";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        padding: "3px 0",
        borderBottom: last ? "none" : "1px solid #edf1f5",
        fontSize: 13,
        lineHeight: 1.3,
      }}
    >
      <span style={{ color: "#64748b", minWidth: 0 }}>{label}</span>
      <span
        style={{
          color: valueColor,
          fontWeight: emphasis ? 700 : 500,
          textAlign: "right",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
};

interface IDapemSimulasi extends IDapem {
  Sumdan: Sumdan;
  angsuran_sumdan: number;
  max_plafond: number;
  max_tenor: number;
}
const defaultData: IDapemSimulasi = {
  nopen: "",
  Sumdan: { max_bpp: 3000000 } as Sumdan,
  Debitur: { birthdate: new Date(), salary: 0 } as Debitur,
  ProdukPembiayaan: {} as ProdukPembiayaan,
  JenisPembiayaan: {} as JenisPembiayaan,
  c_margin: 0,
  c_margin_sumdan: 0,
  c_adm_sumdan: 0,
  c_adm: 0,
  c_provisi_sumdan: 0,
  c_provisi: 0,
  c_insurance: 0,
  c_gov: 0,
  c_account_sumdan: 0,
  c_blokir: 0,
  c_mutasi: 0,
  c_stamp: 0,
  c_flagging: 0,
  c_infomation: 0,
  c_takeover: 0,
  max_plafond: 0,
  max_tenor: 0,
  c_fee_bpp: 0,
  c_ned: 0,
  salary: 0,
  fee_banpot: 0,
  margin_type: "ANUITAS",
  created_at: new Date(),
} as unknown as IDapemSimulasi;
