-- CreateTable
CREATE TABLE `rate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `warehouse` VARCHAR(191) NOT NULL,
    `visit` VARCHAR(191) NOT NULL,
    `firstAnswer` VARCHAR(191) NOT NULL DEFAULT '1',
    `secondAnswer` VARCHAR(191) NOT NULL DEFAULT '1',
    `thirdAnswer` VARCHAR(191) NOT NULL DEFAULT '1',
    `fourthAnswer` VARCHAR(191) NOT NULL DEFAULT '1',
    `fifthAnswer` VARCHAR(191) NOT NULL DEFAULT '1',
    `note` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
