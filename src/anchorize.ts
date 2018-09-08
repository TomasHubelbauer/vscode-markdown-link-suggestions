export default function anchorize(header: string) {
  return header.toLowerCase().replace(/\s/g, '-').replace(/\./g, '');
}
