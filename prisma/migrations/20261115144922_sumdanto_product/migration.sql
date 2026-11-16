/*
  Warnings:

  - You are about to drop the column `c_account_sumdan` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_adm` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_adm_sumdan` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_flagging` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_gov` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_information` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_margin` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_ned` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_provisi` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_provisi_sumdan` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `c_stamps` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `dsr` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `fee_banpot` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `max_bpp` on the `sumdan` table. All the data in the column will be lost.
  - You are about to drop the column `rounded` on the `sumdan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `produkpembiayaan` ADD COLUMN `c_account` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `c_adm` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `c_adm_sumdan` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `c_dsr` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `c_gov` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `c_information` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `c_provisi` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `c_provisi_sumdan` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `c_rounded` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `c_stamp` INTEGER NOT NULL DEFAULT 0,
    MODIFY `c_insurance` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `sumdan` DROP COLUMN `c_account_sumdan`,
    DROP COLUMN `c_adm`,
    DROP COLUMN `c_adm_sumdan`,
    DROP COLUMN `c_flagging`,
    DROP COLUMN `c_gov`,
    DROP COLUMN `c_information`,
    DROP COLUMN `c_margin`,
    DROP COLUMN `c_ned`,
    DROP COLUMN `c_provisi`,
    DROP COLUMN `c_provisi_sumdan`,
    DROP COLUMN `c_stamps`,
    DROP COLUMN `dsr`,
    DROP COLUMN `fee_banpot`,
    DROP COLUMN `max_bpp`,
    DROP COLUMN `rounded`;
