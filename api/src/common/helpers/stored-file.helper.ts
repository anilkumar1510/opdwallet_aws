import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { isAbsolute, join, posix } from 'path';

/**
 * Streams a file recorded on a document (a report, an invoice) back to the
 * caller.
 *
 * **The path never comes from the request.** Callers pass the `filePath` they
 * read off their own database record, having already established that the
 * caller owns it. Nothing here is reachable by editing a URL: a request names a
 * report by id, the record supplies the path, and only the BASENAME of that
 * stored path is ever used to locate the file on disk. That is what keeps
 * `../../` out of the resolution entirely rather than trying to filter it.
 *
 * The fallback exists because stored paths are whatever machine handled the
 * upload recorded — this database carries macOS paths from another developer's
 * laptop and Docker `/app/...` paths — so an absolute path that does not exist
 * here is normal, not corruption. Same approach the claims file route already
 * takes (`memberclaims.controller.ts:364-397`), factored out because there are
 * now four callers instead of one.
 */

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

export interface StoredFile {
  fileName?: string;
  originalName?: string;
  filePath?: string;
}

/**
 * Resolves a stored path to a file that exists on this machine, or null.
 *
 * @param uploadsSubdir the directory under `uploads/` this kind of file lives
 *   in — e.g. 'diagnostic-reports'. Used only for the fallback lookup, and
 *   supplied by the calling controller, never by the request.
 */
function resolveOnDisk(storedPath: string, uploadsSubdir: string): string | null {
  let candidate = storedPath;

  // Docker container paths recorded by a containerised upload.
  if (candidate.startsWith('/app/')) {
    candidate = candidate.replace('/app/', '');
  }

  // isAbsolute() rather than a leading-slash test, so a Windows path
  // ('C:\...') is not mistaken for a relative one and joined onto cwd.
  if (!isAbsolute(candidate)) {
    candidate = join(process.cwd(), candidate);
  }

  if (existsSync(candidate)) return candidate;

  // Not on this machine at that path. Look for the same file in this
  // instance's uploads directory, by basename only.
  const normalised = storedPath.replace(/\\/g, '/');
  const local = join(process.cwd(), 'uploads', uploadsSubdir, posix.basename(normalised));
  return existsSync(local) ? local : null;
}

export function streamStoredFile(
  res: Response,
  file: StoredFile,
  uploadsSubdir: string,
  notFoundMessage = 'File not found',
): void {
  if (!file?.filePath) {
    throw new NotFoundException(notFoundMessage);
  }

  const onDisk = resolveOnDisk(file.filePath, uploadsSubdir);
  if (!onDisk) {
    throw new NotFoundException(notFoundMessage);
  }

  const downloadName = file.originalName?.trim() || file.fileName?.trim() || 'download';
  const ext = downloadName.split('.').pop()?.toLowerCase() ?? '';

  res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
  // Quotes escaped: originalName is member-supplied at upload time, and an
  // unescaped quote here would let it break out of the header value.
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${downloadName.replace(/"/g, '\\"')}"`,
  );

  createReadStream(onDisk).pipe(res);
}
