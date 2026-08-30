-- Create offline_device_registry table for tracking enrolled offline devices
CREATE TABLE IF NOT EXISTS `offline_device_registry` (
  `id` VARCHAR(36) NOT NULL,
  `deviceId` VARCHAR(100) NOT NULL,
  `deviceName` VARCHAR(200) NOT NULL,
  `deviceType` VARCHAR(30) NOT NULL DEFAULT 'DESKTOP',
  `companyId` VARCHAR(36) NULL,
  `lastSyncAt` DATETIME(3) NULL,
  `pendingCount` INT NOT NULL DEFAULT 0,
  `isOnline` TINYINT(1) NOT NULL DEFAULT 1,
  `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `offline_device_registry_deviceId_key` (`deviceId`),
  INDEX `offline_device_registry_companyId_idx` (`companyId`),
  INDEX `offline_device_registry_deviceId_idx` (`deviceId`),
  CONSTRAINT `offline_device_registry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
