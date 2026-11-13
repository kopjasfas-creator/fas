import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import prisma from "@/libs/Prisma";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const backdate = request.nextUrl.searchParams.get("backdate");
  const [asset, kewajiban, modal, pendapatan, beban] =
    await prisma.$transaction([
      prisma.categoryOfAccount.findMany({
        where: {
          type: "ASSET",
          parentId: null,
        },
        include: {
          Parent: true,
          Childrens: {
            include: {
              JournalDetails: {
                where: {
                  ...(backdate && {
                    JournalEntry: {
                      date: {
                        gte: moment(backdate.split(",")[0]).toDate(),
                        lte: moment(backdate.split(",")[1]).endOf("day").toDate(),
                      },
                    },
                  }),
                },
              },
            },
          },
          JournalDetails: true,
        },
      }),
      prisma.categoryOfAccount.findMany({
        where: {
          type: "KEWAJIBAN",
          parentId: null,
        },
        include: {
          Parent: true,
          Childrens: {
            include: {
              JournalDetails: {
                where: {
                  ...(backdate && {
                    JournalEntry: {
                      date: {
                        gte: moment(backdate.split(",")[0]).toDate(),
                        lte: moment(backdate.split(",")[1]).endOf("day").toDate(),
                      },
                    },
                  }),
                },
              },
            },
          },
          JournalDetails: true,
        },
      }),
      prisma.categoryOfAccount.findMany({
        where: {
          type: "MODAL",
          parentId: null,
        },
        include: {
          Parent: true,
          Childrens: {
            include: {
              JournalDetails: {
                where: {
                  ...(backdate && {
                    JournalEntry: {
                      date: {
                        gte: moment(backdate.split(",")[0]).toDate(),
                        lte: moment(backdate.split(",")[1]).endOf("day").toDate(),
                      },
                    },
                  }),
                },
              },
            },
          },
          JournalDetails: true,
        },
      }),
      prisma.journalDetail.findMany({
        where: {
          CategoryOfAccount: { type: "PENDAPATAN" },
          ...(backdate && {
            JournalEntry: {
              date: {
                gte: moment(backdate.split(",")[0]).toDate(),
                lte: moment(backdate.split(",")[1]).endOf("day").toDate(),
              },
            },
          }),
        },
        include: { CategoryOfAccount: true },
      }),
      prisma.journalDetail.findMany({
        where: {
          CategoryOfAccount: { type: "BEBAN" },
          ...(backdate && {
            JournalEntry: {
              date: {
                gte: moment(backdate.split(",")[0]).toDate(),
                lte: moment(backdate.split(",")[1]).endOf("day").toDate(),
              },
            },
          }),
        },
        include: { CategoryOfAccount: true },
      }),
    ]);

  return NextResponse.json(
    {
      data: serializeForApi({
        asset,
        kewajiban,
        modal,
        pendapatan,
        beban,
      }),
      status: 200,
    },
    { status: 200 },
  );
};

// RUGILABA
export const POST = async (request: NextRequest) => {
  const backdate = request.nextUrl.searchParams.get("backdate");
  const [pendapatan, beban] = await prisma.$transaction([
    prisma.categoryOfAccount.findMany({
      where: {
        type: "PENDAPATAN",
        parentId: { not: null },
      },
      include: {
        JournalDetails: {
          include: { JournalEntry: true },
          where: {
            ...(backdate && {
              JournalEntry: {
                date: {
                  gte: moment(backdate.split(",")[0]).toDate(),
                  lte: moment(backdate.split(",")[1]).endOf("day").toDate(),
                },
              },
            }),
          },
        },
      },
    }),
    prisma.categoryOfAccount.findMany({
      where: {
        type: "BEBAN",
        parentId: { not: null },
      },
      include: {
        JournalDetails: {
          include: { JournalEntry: true },
          where: {
            ...(backdate && {
              JournalEntry: {
                date: {
                  gte: moment(backdate.split(",")[0]).toDate(),
                  lte: moment(backdate.split(",")[1]).endOf("day").toDate(),
                },
              },
            }),
          },
        },
      },
    }),
  ]);

  return NextResponse.json(
    {
      data: serializeForApi({
        pendapatan,
        beban,
      }),
      status: 200,
    },
    { status: 200 },
  );
};
