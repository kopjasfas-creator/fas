-- AlterTable
ALTER TABLE `dapem` ADD COLUMN `pay_kcp` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sumdan` ADD COLUMN `blokir_mitra` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `include_blokir` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `provisi_name` VARCHAR(191) NULL;
