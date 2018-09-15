export default function anchorize(header: string) {
  return header.replace(/^#+/g, '').trim().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}
