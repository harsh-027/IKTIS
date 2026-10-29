ALTER TABLE `users`
  ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL,
  ADD COLUMN `privacyPolicyVersion` VARCHAR(32) NULL,
  ADD COLUMN `privacyPolicyAcceptedAt` DATETIME(3) NULL;
