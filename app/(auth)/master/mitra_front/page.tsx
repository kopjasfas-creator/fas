"use client";

import { FormInput } from "@/components";
import {
  FormatProvisi,
  GetSisaPokokMargin,
  IDRFormat,
  IDRToNumber,
  IsProvisiPercentage,
  serializeForApi,
} from "@/components/utils/PembiayaanUtil";
import { IActionTable, IDapem, IPageProps, ISumdan } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  BankOutlined,
  CalendarOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  PhoneOutlined,
  PlusCircleFilled,
  SaveOutlined,
} from "@ant-design/icons";
import type {
  EMarginType,
  ProdukPembiayaan,
  Sumdan,
} from "../../../../generated/prisma/client";
import {
  App,
  Button,
  Card,
  Divider,
  Input,
  Modal,
  Progress,
  Table,
  TableProps,
  Tabs,
  Typography,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";
const { Paragraph } = Typography;

export default function Page() {
  const [upsert, setUpsert] = useState<IActionTable<ISumdan>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [pageProps, setPageProps] = useState<IPageProps<ISumdan>>({
    page: 1,
    limit: 10,
    total: 0,
    data: [],
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess(
    window ? window.location.pathname : "/master/mitra_front",
  );

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pageProps.page.toString(),
      limit: pageProps.limit.toString(),
      ...(pageProps.search && { search: pageProps.search }),
      includes: "true",
      front: "true",
    });
    const res = await fetch(`/api/sumdan?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: serializeForApi(json.data),
      total: json.total,
    }));
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.limit, pageProps.search]);

  const columns: TableProps<ISumdan>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render(value, record, index) {
        return (
          <>
            <div>{(pageProps.page - 1) * pageProps.limit + index + 1}</div>
            <div className="opacity-70">{record.id}</div>
          </>
        );
      },
    },
    {
      title: "Nama Mitra",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render(value, record, index) {
        return (
          <div>
            <p>{record.name}</p>
            <p className="opacity-80">@{record.code}</p>
          </div>
        );
      },
    },
    {
      title: "Kontak",
      dataIndex: "code",
      key: "code",
      width: 200,
      render(value, record, index) {
        return (
          <div>
            <div className="  ">
              <p>
                <EnvironmentOutlined /> {record.address}
              </p>
              <p>
                <PhoneOutlined /> {record.phone}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Kriteria",
      dataIndex: "rt",
      key: "rt",
      render(value, record, index) {
        return (
          <div>
            <div className="  text-blue-400">
              <p>TBO : {record.tbo} Bulan</p>
              <p>Limit : {IDRFormat(Number(record.limit))}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Limit",
      dataIndex: "limit",
      key: "limit",
      render(value, record, index) {
        const total = record.ProdukPembiayaans.flatMap((d) => d.Dapems).reduce(
          (acc, curr) => acc + curr.plafond,
          0,
        );
        const os = record.ProdukPembiayaans.flatMap((d) =>
          d.Dapems.filter((dp) => dp.dropping_status === "DISETUJUI").flatMap(
            (dpa) => GetSisaPokokMargin(dpa as unknown as IDapem).principal,
          ),
        ).reduce((acc, curr) => acc + curr, 0);
        return (
          <div className="flex flex-col">
            <Progress
              percent={Number(
                ((total / Number(record.limit)) * 100).toFixed(2),
              )}
            />
            <div className="opacity-80">
              {IDRFormat(total)} | {IDRFormat(Number(record.limit))}
            </div>
            <div className="opacity-80 text-center">OS {IDRFormat(os)}</div>
          </div>
        );
      },
    },
    {
      title: "Keterangan",
      dataIndex: "desc",
      key: "desc",
      render(value, record, index) {
        return (
          <Paragraph
            ellipsis={{
              rows: 3,
              expandable: "collapsible",
            }}
            style={{ fontSize: 11, width: 150 }}
          >
            {record.description}
          </Paragraph>
        );
      },
    },
    {
      title: "Kerjasama",
      dataIndex: "kerjasama",
      key: "kerjasama",
      render(value, record, index) {
        return (
          <div>
            <div>
              <FileProtectOutlined /> {record.contract_no}
            </div>
            <div>
              <FileProtectOutlined /> {record.contract_no2}
            </div>
            <div>
              <CalendarOutlined />{" "}
              {moment(record.contract_date).format("DD/MM/YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
          {hasAccess("update") && (
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, upsert: true, selected: record })
              }
              size="small"
              type="primary"
            ></Button>
          )}
          {hasAccess("delete") && (
            <Button
              icon={<DeleteOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, delete: true, selected: record })
              }
              size="small"
              type="primary"
              danger
            ></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      title={
        <div className="flex gap-2 font-bold text-xl">
          <BankOutlined /> Mitra Pembiayaan
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex justify-between my-1">
        {hasAccess("write") && (
          <Button
            size="small"
            type="primary"
            icon={<PlusCircleFilled />}
            onClick={() =>
              setUpsert({ ...upsert, upsert: true, selected: undefined })
            }
          >
            Add New
          </Button>
        )}
        <Input.Search
          size="small"
          style={{ width: 170 }}
          placeholder="Cari nama..."
          onChange={(e) =>
            setPageProps({ ...pageProps, search: e.target.value })
          }
        />
      </div>

      <Table
        columns={columns}
        dataSource={pageProps.data}
        size="small"
        loading={loading}
        rowKey={"id"}
        bordered
        scroll={{ x: "max-content", y: "48vh" }}
        pagination={{
          current: pageProps.page,
          pageSize: pageProps.limit,
          total: pageProps.total,
          onChange: (page, pageSize) => {
            setPageProps((prev) => ({
              ...prev,
              page,
              limit: pageSize,
            }));
          },
          pageSizeOptions: [50, 100, 500, 1000],
          showSizeChanger: true,
        }}
        expandable={{
          expandedRowRender: (record) => {
            return (
              <div className="ms-15">
                <TableProduk
                  records={record}
                  getData={getData}
                  modal={modal}
                  hasAccess={hasAccess}
                />
              </div>
            );
          },
        }}
      />
      <UpsertSumdan
        open={upsert.upsert}
        record={upsert.selected}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        modal={modal}
        key={upsert.selected ? "upsert" + upsert.selected.id : "create"}
      />
      <DeleteSumdan
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        getData={getData}
        record={upsert.selected}
        key={upsert.selected ? "delete" + upsert.selected.id : "delete"}
        modal={modal}
      />
    </Card>
  );
}

function UpsertSumdan({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: ISumdan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [data, setData] = useState(record ? record : defaultSumdan);
  const [loading, setLoading] = useState(false);
  // const [currentStep, setCurrentStep] = useState(0);

  const handleSave = async () => {
    setLoading(true);
    const { ProdukPembiayaans, ...saved } = data;

    await fetch("/api/sumdan", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(
        serializeForApi({
          ...saved,
          limit: Number(saved.limit),
          // file: JSON.stringify(data.file),
        }),
      ),
    })
      .then((res) => res.json())
      .then(async (res) => {
        console.log(res);
        if (res.status === 201 || res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: `Data berhasil ${record ? "di Update" : "ditambahkan"}!`,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          modal.error({
            title: "ERROR",
            content: res.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      title={record ? "Update Mitra " + record.name : "Add New Mitra"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
      width={1200}
      style={{ top: 10 }}
      destroyOnHidden
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-1">
          <div className="hidden">
            <FormInput
              data={{
                label: "ID",
                mode: "horizontal",
                type: "text",
                value: data.id,
                onChange: (e: string) => setData({ ...data, id: e }),
              }}
            />
          </div>
          <FormInput
            data={{
              label: "Nama Mitra",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.name,
              onChange: (e: string) => setData({ ...data, name: e }),
            }}
          />
          <FormInput
            data={{
              label: "Kode Mitra",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.code,
              onChange: (e: string) => setData({ ...data, code: e }),
            }}
          />
          <FormInput
            data={{
              label: "No Telepon",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.phone,
              onChange: (e: string) => setData({ ...data, phone: e }),
            }}
          />
          <FormInput
            data={{
              label: "Email",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.email,
              onChange: (e: string) => setData({ ...data, email: e }),
            }}
          />
          <FormInput
            data={{
              label: "Alamat",
              mode: "horizontal",
              required: true,
              type: "textarea",
              value: data.address,
              onChange: (e: string) => setData({ ...data, address: e }),
            }}
          />
          <FormInput
            data={{
              label: "Keterangan",
              mode: "horizontal",
              required: true,
              type: "textarea",
              value: data.description,
              onChange: (e: string) => setData({ ...data, description: e }),
            }}
          />
          <FormInput
            data={{
              label: "Logo Mitra",
              mode: "horizontal",
              type: "upload",
              accept: "image/png,image/jpg,image/jpeg",
              value: data.logo,
              onChange: (e: string) => setData({ ...data, logo: e }),
            }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <FormInput
            data={{
              label: "No PKS Mitra",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.contract_no,
              onChange: (e: string) => setData({ ...data, contract_no: e }),
            }}
          />
          <FormInput
            data={{
              label: "No PKS Koperasi",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.contract_no2,
              onChange: (e: string) => setData({ ...data, contract_no2: e }),
            }}
          />
          <FormInput
            data={{
              label: "Tanggal PKS",
              mode: "horizontal",
              required: true,
              type: "date",
              value: moment(data.contract_date).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({ ...data, contract_date: new Date(e) }),
            }}
          />
          <FormInput
            data={{
              label: "No SK",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.sk_no,
              onChange: (e: string) => setData({ ...data, sk_no: e }),
            }}
          />
          <FormInput
            data={{
              label: "Tanggal SK",
              mode: "horizontal",
              required: true,
              type: "date",
              value: moment(data.sk_date).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({ ...data, sk_date: new Date(e) }),
            }}
          />
          <FormInput
            data={{
              label: "PIC",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.pic,
              onChange: (e: string) => setData({ ...data, pic: e }),
            }}
          />
          <FormInput
            data={{
              label: "Limit Pembiayaan",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(Number(data.limit) || 0),
              onChange: (e: string) =>
                setData({
                  ...data,
                  limit: BigInt(IDRToNumber(e || "0")),
                }),
            }}
          />
          <FormInput
            data={{
              label: "TBO Berkas",
              mode: "horizontal",
              type: "number",
              value: data.tbo,
              onChange: (e: string) => setData({ ...data, tbo: parseInt(e) }),
            }}
          />
          <div className="mt-4">
            Kelengkapan Berkas Standing Instruction (SI)
          </div>
          <FormInput
            data={{
              label: "Blokir Angsuran",
              mode: "horizontal",
              type: "select",
              value: data.include_blokir,
              onChange: (e: boolean) => setData({ ...data, include_blokir: e }),
              options: [
                { label: "Ya, Ada Blokir Angsuran", value: true },
                { label: "Tidak, Tanpa Blokir Angsuran", value: false },
              ],
            }}
          />
          <FormInput
            data={{
              label: "Versi Blokir Angsuran",
              mode: "horizontal",
              type: "select",
              value: data.blokir_mitra,
              onChange: (e: boolean) => setData({ ...data, blokir_mitra: e }),
              options: [
                { label: "Angsuran Versi Sumdan", value: true },
                { label: "Angsuran Versi Koperasi (Full)", value: false },
              ],
              hidden: !data.include_blokir,
            }}
          />
          <FormInput
            data={{
              label: "Samaran Provisi",
              mode: "horizontal",
              type: "text",
              value: data.provisi_name,
              onChange: (e: string) =>
                setData({ ...data, provisi_name: e || null }),
            }}
          />
          <div className="text-xs italic mt-2">
            Kosongkan samaran provisi jika tidak ingin mengubah nama biaya
            provisi.
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          icon={<SaveOutlined />}
          type="primary"
          onClick={() => handleSave()}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}

export function DeleteSumdan({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: ISumdan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/sumdan?id=${record?.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          modal.success({
            title: "SUCCESS",
            content: data.msg,
          });
          setOpen(false);
          getData && getData();
        } else {
          modal.error({
            title: "ERROR",
            content: data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };
  return (
    <Modal
      loading={loading}
      footer={[]}
      open={open}
      onCancel={() => setOpen(false)}
      width={400}
      style={{ top: 20 }}
      title={"Delete Sumber Dana " + record?.name}
      destroyOnHidden
    >
      <p>Are you sure you want to delete this sumber dana?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

function TableProduk({
  records,
  getData,
  modal,
  hasAccess,
}: {
  records: ISumdan;
  getData: Function;
  modal: HookAPI;
  hasAccess: Function;
}) {
  const [upsert, setUpsert] = useState<IActionTable<ProdukPembiayaan>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });

  const columns: TableProps<ProdukPembiayaan>["columns"] = [
    {
      title: "Produk",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render(value, record, index) {
        return (
          <div>
            <div>{record.name}</div>
            <div className="opacity-70">{record.id}</div>
          </div>
        );
      },
    },
    {
      title: "Kriteria",
      dataIndex: "kriteria",
      key: "kriteria",
      render(value, record, index) {
        return (
          <div className="">
            <p>
              Usia : {record.min_age} - {record.max_age}
            </p>
            <p>Lunas : {record.max_paid}</p>
            <div>Janis Margin : {record.margin_type}</div>
          </div>
        );
      },
    },
    {
      title: "Pembiayaan",
      dataIndex: "kriteria",
      key: "kriteria",
      render(value, record, index) {
        return (
          <div className="text-blue-400">
            <p>Tenor : {record.max_tenor} Bulan</p>
            <p>Plafond : {IDRFormat(record.max_plafond)}</p>
            <p>DSR : {record.c_dsr}%</p>
            <p>Pembulatan : {IDRFormat(record.c_rounded)}</p>
          </div>
        );
      },
    },
    {
      title: "Biaya Sumdan",
      dataIndex: "biaya",
      key: "biaya",
      render(value, record, index) {
        return (
          <div className="text-blue-400">
            <div>Margin : {record.c_margin_sumdan}%</div>
            <div>Adm : {record.c_adm_sumdan}%</div>
            <div>Provisi : {FormatProvisi(record.c_provisi_sumdan)}</div>
            <div>Rekening : {record.c_account}%</div>
          </div>
        );
      },
    },
    {
      title: "Biaya Koperasi",
      dataIndex: "biaya",
      key: "biaya",
      render(value, record, index) {
        return (
          <div className="text-blue-400">
            <div>Margin : {record.c_margin}%</div>
            <div>Adm : {record.c_adm}%</div>
            <div>Provisi : {FormatProvisi(record.c_provisi)}</div>
            <div>Asuransi : {record.c_insurance}%</div>
            <div>Tatalaksana : {IDRFormat(record.c_gov)}</div>
            <div>Materai : {IDRFormat(record.c_stamp)}</div>
            <div>Data Informasi : {IDRFormat(record.c_information)}</div>
          </div>
        );
      },
    },
    {
      title: "Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) => (
        <div className="text-xs">{moment(date).format("DD-MM-YYYY")}</div>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
          {hasAccess("update") && (
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, upsert: true, selected: record })
              }
              size="small"
              type="primary"
            ></Button>
          )}
          {hasAccess("delete") && (
            <Button
              icon={<DeleteOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, delete: true, selected: record })
              }
              size="small"
              type="primary"
              danger
            ></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {hasAccess("write") && (
        <Button
          icon={<PlusCircleFilled />}
          size="small"
          type="primary"
          onClick={() =>
            setUpsert({ ...upsert, upsert: true, selected: undefined })
          }
        >
          Add Produk
        </Button>
      )}
      <Table
        columns={columns}
        dataSource={records.ProdukPembiayaans}
        rowKey={"id"}
        pagination={false}
        size="small"
        bordered
      />
      <UpsertProduk
        open={upsert.upsert}
        record={upsert.selected}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        modal={modal}
        sumdan={records}
        key={upsert.selected ? "upsert" + upsert.selected.id : "createproduk"}
      />
      <DeleteProduk
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        getData={getData}
        modal={modal}
        record={upsert.selected}
        key={upsert.selected ? "delete" + upsert.selected.id : "deleteproduk"}
      />
    </div>
  );
}

function UpsertProduk({
  record,
  open,
  setOpen,
  getData,
  modal,
  sumdan,
}: {
  record?: ProdukPembiayaan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
  sumdan: Sumdan;
}) {
  const [data, setData] = useState(record ? record : defaultProduk);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const productData = { ...data } as typeof data & { Dapem?: unknown };
    delete productData.Dapem;
    await fetch("/api/produk", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify({ ...productData, sumdanId: sumdan.id }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        console.log(res);
        if (res.status === 201 || res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: `Data berhasil ${record ? "di Update" : "ditambahkan"}!`,
          });
          setOpen(false);
          getData && getData();
        } else {
          modal.error({
            title: "ERROR",
            content: res.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      title={`${sumdan.code} | ${
        record ? "Update Produk " + record.name : "Add New Produk"
      }`}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
      width={1200}
      style={{ top: 20 }}
      destroyOnHidden
    >
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-1">
          <div className="hidden">
            <FormInput
              data={{
                label: "ID",
                mode: "horizontal",
                type: "text",
                value: data.id,
                onChange: (e: string) => setData({ ...data, id: e }),
              }}
            />
          </div>
          <FormInput
            data={{
              label: "Produk Pembiayaan",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.name,
              onChange: (e: string) => setData({ ...data, name: e }),
            }}
          />
          <FormInput
            data={{
              label: "Min Usia",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.min_age,
              onChange: (e: string) =>
                setData({ ...data, min_age: parseInt(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Maks Usia",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.max_age,
              onChange: (e: string) =>
                setData({ ...data, max_age: parseInt(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Usia Lunas",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.max_paid,
              onChange: (e: string) =>
                setData({ ...data, max_paid: parseInt(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Max Tenor",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.max_tenor,
              onChange: (e: string) =>
                setData({ ...data, max_tenor: parseInt(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Max Plafond",
              mode: "horizontal",
              required: true,
              type: "text",
              value: IDRFormat(data.max_plafond),
              onChange: (e: string) =>
                setData({ ...data, max_plafond: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "DBR",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.c_dsr,
              onChange: (e: string) =>
                setData({ ...data, c_dsr: parseFloat(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Pembulatan",
              mode: "horizontal",
              required: true,
              type: "text",
              value: IDRFormat(data.c_rounded),
              onChange: (e: string) =>
                setData({ ...data, c_rounded: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Jenis Margin",
              mode: "horizontal",
              type: "select",
              required: true,
              options: [
                { label: "EFEKTIF", value: "EFEKTIF" },
                { label: "ANUITAS", value: "ANUITAS" },
                { label: "FLAT", value: "FLAT" },
              ],
              value: data.margin_type,
              onChange: (e: EMarginType) =>
                setData({ ...data, margin_type: e }),
            }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex gap-4">
            <FormInput
              data={{
                class: "flex-1",
                label: "Margin Mitra",
                mode: "horizontal",
                type: "number",
                required: true,
                value: data.c_margin_sumdan,
                onChange: (e: string) =>
                  setData({ ...data, c_margin_sumdan: parseFloat(e || "0") }),
              }}
            />
            <FormInput
              data={{
                class: "flex-1",
                label: "Margin Koperasi",
                mode: "horizontal",
                type: "number",
                required: true,
                value: data.c_margin,
                suffix: `${data.c_margin_sumdan + data.c_margin}%`,
                onChange: (e: string) =>
                  setData({ ...data, c_margin: parseFloat(e || "0") }),
              }}
            />
          </div>
          <div className="flex gap-4">
            <FormInput
              data={{
                class: "flex-1",
                label: "Adm Mitra",
                mode: "horizontal",
                type: "number",
                required: true,
                value: data.c_adm_sumdan,
                onChange: (e: string) =>
                  setData({ ...data, c_adm_sumdan: parseFloat(e || "0") }),
              }}
            />
            <FormInput
              data={{
                class: "flex-1",
                label: "Adm Koperasi",
                mode: "horizontal",
                type: "number",
                required: true,
                value: data.c_adm,
                suffix: `${data.c_adm_sumdan + data.c_adm}%`,
                onChange: (e: string) =>
                  setData({ ...data, c_adm: parseFloat(e || "0") }),
              }}
            />
          </div>
          <div className="flex gap-4">
            <FormInput
              data={{
                class: "flex-1",
                label: "Provisi Mitra",
                mode: "horizontal",
                type: "number",
                required: true,
                value: data.c_provisi_sumdan,
                suffix: IsProvisiPercentage(data.c_provisi_sumdan) ? "%" : "Rp",
                onChange: (e: string) =>
                  setData({ ...data, c_provisi_sumdan: parseFloat(e || "0") }),
              }}
            />
            <FormInput
              data={{
                class: "flex-1",
                label: "Provisi Koperasi",
                mode: "horizontal",
                type: "number",
                required: true,
                value: data.c_provisi,
                suffix: IsProvisiPercentage(data.c_provisi) ? "%" : "Rp",
                onChange: (e: string) =>
                  setData({ ...data, c_provisi: parseFloat(e || "0") }),
              }}
            />
          </div>
          <FormInput
            data={{
              label: "Asuransi",
              mode: "horizontal",
              type: "number",
              required: true,
              value: data.c_insurance,
              onChange: (e: string) =>
                setData({ ...data, c_insurance: parseFloat(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Buka Rekening",
              mode: "horizontal",
              required: true,
              type: "text",
              value: IDRFormat(data.c_account),
              onChange: (e: string) =>
                setData({ ...data, c_account: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Tatalaksana",
              mode: "horizontal",
              required: true,
              type: "text",
              value: IDRFormat(data.c_gov),
              onChange: (e: string) =>
                setData({ ...data, c_gov: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Data Materai",
              mode: "horizontal",
              required: true,
              type: "text",
              value: IDRFormat(data.c_stamp),
              onChange: (e: string) =>
                setData({ ...data, c_stamp: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Data Informasi",
              mode: "horizontal",
              required: true,
              type: "text",
              value: IDRFormat(data.c_information),
              onChange: (e: string) =>
                setData({ ...data, c_information: IDRToNumber(e || "0") }),
            }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-2">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          icon={<SaveOutlined />}
          type="primary"
          onClick={() => handleSave()}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}

export function DeleteProduk({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: ProdukPembiayaan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/produk?id=${record?.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          modal.success({
            title: "SUCCESS",
            content: data.msg,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          modal.error({
            title: "ERROR",
            content: data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };
  return (
    <Modal
      loading={loading}
      footer={[]}
      open={open}
      onCancel={() => setOpen(false)}
      width={400}
      style={{ top: 20 }}
      title={"Delete Produk " + record?.name}
      destroyOnHidden
    >
      <p>Are you sure you want to delete this produk?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

const defaultProduk: ProdukPembiayaan = {
  id: "",
  name: "",
  c_margin: 0,
  c_margin_sumdan: 0,
  c_adm: 0,
  c_adm_sumdan: 0,
  c_provisi: 0,
  c_provisi_sumdan: 0,
  c_account: 0,
  c_gov: 0,
  c_information: 0,
  c_stamp: 0,
  c_rounded: 0,
  c_dsr: 0,
  min_age: 0,
  max_age: 0,
  max_paid: 0,
  c_insurance: 0,
  max_tenor: 0,
  max_plafond: 0,
  margin_type: "ANUITAS",

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  sumdanId: "",
};

const defaultSumdan: ISumdan = {
  id: "",
  name: "",
  code: "",
  address: null,
  phone: null,
  email: null,
  description: null,
  logo: null,
  tbo: 3,
  ProdukPembiayaans: [],
  pic: null,
  file: "",
  contract_no: "",
  contract_no2: "",
  contract_date: new Date(),
  sk_no: "",
  sk_date: new Date(),
  sk_akad: "",
  limit: BigInt(0),
  include_blokir: true,
  blokir_mitra: false,
  provisi_name: null,

  fronting: false,
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};
