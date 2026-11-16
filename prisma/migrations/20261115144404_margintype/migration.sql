/*
  Warnings:

  - The values [ANUITASS] on the enum `datasimulasi_margin_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [ANUITASS] on the enum `datasimulasi_margin_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [ANUITASS] on the enum `datasimulasi_margin_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `dapem` MODIFY `margin_type` ENUM('FLAT', 'ANUITAS', 'EFEKTIF') NOT NULL;

-- AlterTable
ALTER TABLE `datasimulasi` MODIFY `margin_type` ENUM('FLAT', 'ANUITAS', 'EFEKTIF') NOT NULL DEFAULT 'ANUITAS';

-- AlterTable
ALTER TABLE `produkpembiayaan` MODIFY `margin_type` ENUM('FLAT', 'ANUITAS', 'EFEKTIF') NOT NULL;
