UPDATE `dapem`
SET `margin_type` = 'ANUITAS'
WHERE `margin_type` = '';

UPDATE `produkpembiayaan`
SET `margin_type` = 'ANUITAS'
WHERE `margin_type` = '';

UPDATE `datasimulasi`
SET `margin_type` = 'ANUITAS'
WHERE `margin_type` = '';
