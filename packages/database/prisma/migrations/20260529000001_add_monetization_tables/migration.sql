-- ── Monetization Tables ──────────────────────────────────────────────────────
-- Migration: 20260529000001_add_monetization_tables
-- Adds: monetization_product, monetization_subscription, monetization_purchase,
--       monetization_trial, monetization_entitlement

-- Product catalogue
CREATE TABLE `monetization_product` (
  `id`            VARCHAR(36)    NOT NULL,
  `name`          VARCHAR(200)   NOT NULL,
  `slug`          VARCHAR(100)   NOT NULL,
  `type`          VARCHAR(20)    NOT NULL DEFAULT 'SUBSCRIPTION',
  `featureKeys`   LONGTEXT       NOT NULL,
  `priceMonthly`  DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
  `priceAnnual`   DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
  `priceLifetime` DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
  `trialDays`     INT            NOT NULL DEFAULT 14,
  `isActive`      TINYINT(1)     NOT NULL DEFAULT 1,
  `createdAt`     DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)    NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `monetization_product_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Subscriptions (recurring billing)
CREATE TABLE `monetization_subscription` (
  `id`                   VARCHAR(36)   NOT NULL,
  `companyId`            VARCHAR(36)   NOT NULL,
  `productId`            VARCHAR(36)   NOT NULL,
  `billingCycle`         VARCHAR(10)   NOT NULL DEFAULT 'MONTHLY',
  `status`               VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  `currentPeriodStart`   DATETIME(3)   NOT NULL,
  `currentPeriodEnd`     DATETIME(3)   NOT NULL,
  `providerRef`          VARCHAR(200)  NULL,
  `providerSubId`        VARCHAR(200)  NULL,
  `cancelledAt`          DATETIME(3)   NULL,
  `cancelReason`         VARCHAR(500)  NULL,
  `createdAt`            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`            DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `monetization_subscription_companyId_idx` (`companyId`),
  INDEX `monetization_subscription_status_idx` (`status`),
  INDEX `monetization_subscription_currentPeriodEnd_idx` (`currentPeriodEnd`),
  CONSTRAINT `monetization_subscription_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `monetization_subscription_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `monetization_product` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Lifetime purchases (one-time, non-expiring)
CREATE TABLE `monetization_purchase` (
  `id`          VARCHAR(36)   NOT NULL,
  `companyId`   VARCHAR(36)   NOT NULL,
  `productId`   VARCHAR(36)   NOT NULL,
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'COMPLETED',
  `amountPaid`  DECIMAL(18,2) NOT NULL,
  `providerRef` VARCHAR(200)  NULL,
  `receiptUrl`  VARCHAR(500)  NULL,
  `refundedAt`  DATETIME(3)   NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `monetization_purchase_companyId_idx` (`companyId`),
  INDEX `monetization_purchase_status_idx` (`status`),
  CONSTRAINT `monetization_purchase_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `monetization_purchase_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `monetization_product` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Free trials
CREATE TABLE `monetization_trial` (
  `id`          VARCHAR(36)  NOT NULL,
  `companyId`   VARCHAR(36)  NOT NULL,
  `productId`   VARCHAR(36)  NOT NULL,
  `startsAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endsAt`      DATETIME(3)  NOT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  `convertedAt` DATETIME(3)  NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `monetization_trial_companyId_productId_key` (`companyId`, `productId`),
  INDEX `monetization_trial_companyId_idx` (`companyId`),
  INDEX `monetization_trial_status_idx` (`status`),
  INDEX `monetization_trial_endsAt_idx` (`endsAt`),
  CONSTRAINT `monetization_trial_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `monetization_trial_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `monetization_product` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Effective entitlement cache (O(1) guard reads)
CREATE TABLE `monetization_entitlement` (
  `id`         VARCHAR(36)   NOT NULL,
  `companyId`  VARCHAR(36)   NOT NULL,
  `featureKey` VARCHAR(200)  NOT NULL,
  `source`     VARCHAR(20)   NOT NULL,
  `expiresAt`  DATETIME(3)   NULL,
  `createdAt`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `monetization_entitlement_companyId_featureKey_key` (`companyId`, `featureKey`),
  INDEX `monetization_entitlement_companyId_idx` (`companyId`),
  INDEX `monetization_entitlement_featureKey_idx` (`featureKey`),
  INDEX `monetization_entitlement_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `monetization_entitlement_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `company` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
