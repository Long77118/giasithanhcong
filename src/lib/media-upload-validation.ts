import { APIError, type CollectionBeforeOperationHook } from 'payload';
import { imageUploadConfig } from './image-upload-config';
import { mediaUploadError } from './image-upload';

// Runs before generateFileData/storage, for REST, GraphQL and the Local API.
// Scope the limit to Media so PDF uploads keep their existing policy.
export const validateMediaUpload: CollectionBeforeOperationHook = ({ operation, req }) => {
  if (!['create', 'update'].includes(operation) || !req.file) return;
  const { file } = req;
  const size = Math.max(file.size, file.data?.byteLength ?? 0);
  const error = mediaUploadError(size, file.mimetype, file.data);
  if (error) throw new APIError(error, size > imageUploadConfig.maxSourceBytes ? 413 : 400);
  // Payload's own checkFileRestrictions subsequently validates the byte signature,
  // not just the MIME supplied by a client. Do not disable this validation.
};
