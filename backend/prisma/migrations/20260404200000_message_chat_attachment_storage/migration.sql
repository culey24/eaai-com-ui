-- File đính kèm chat (GCS hoặc đĩa qua chatAttachmentStorage.js)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_storage_key VARCHAR(512);
