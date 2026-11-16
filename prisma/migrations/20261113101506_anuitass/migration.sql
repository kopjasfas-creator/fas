-- AlterTable
ALTER TABLE `dapem` MODIFY `margin_type` ENUM('FLAT', 'ANUITAS', 'ANUITASS') NOT NULL;

-- AlterTable
ALTER TABLE `datasimulasi` MODIFY `margin_type` ENUM('FLAT', 'ANUITAS', 'ANUITASS') NOT NULL DEFAULT 'ANUITAS';

-- AlterTable
ALTER TABLE `produkpembiayaan` MODIFY `margin_type` ENUM('FLAT', 'ANUITAS', 'ANUITASS') NOT NULL;
