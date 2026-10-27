function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * Pulls the document id out of an `/dms/api/v1/emrImage` response body.
 *
 * The claims page reads `resource[0].document_id`, but `emrImage` may answer with a
 * single object instead of a one-element list, and has been seen using `id` as well.
 * Both shapes are accepted so a contract change cannot silently leave `doc_id`
 * undefined. Returns null when nothing usable is present, which the caller treats as
 * a failed upload rather than a success carrying no id.
 */
export function readUploadedDocId(body: unknown): string | null {
  const envelope = asRecord(body);
  if (!envelope || envelope['errCode'] !== 0) return null;

  const resource = envelope['resource'];
  const record = asRecord(Array.isArray(resource) ? resource[0] : resource);
  if (!record) return null;

  for (const field of ['id', 'document_id'] as const) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}
