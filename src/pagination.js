export function encodeCursor(job) {
  return Buffer.from(`${job.createdAt.toISOString()}|${job.id}`).toString('base64');
}

export function decodeCursor(cursor) {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  const sep = decoded.lastIndexOf('|');
  return {
    createdAt: new Date(decoded.slice(0, sep)),
    id: decoded.slice(sep + 1),
  };
}
