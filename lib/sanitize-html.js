const BLOCKED_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'svg',
  'math',
];

const URL_ATTRS = ['href', 'src', 'xlink:href', 'action', 'formaction', 'srcset'];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function sanitizeHtml(html) {
  if (!html) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return escapeHtml(String(html).replace(/<[^>]*>/g, ' '));
  }

  const doc = new DOMParser().parseFromString(String(html), 'text/html');

  doc.querySelectorAll(BLOCKED_TAGS.join(',')).forEach((node) => node.remove());

  doc.body.querySelectorAll('*').forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      if (name.startsWith('on') || name === 'style') {
        node.removeAttribute(attr.name);
        continue;
      }

      if (
        URL_ATTRS.includes(name) &&
        (value.startsWith('javascript:') || value.startsWith('vbscript:') || value.startsWith('data:text'))
      ) {
        node.removeAttribute(attr.name);
      }
    }

    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return doc.body.innerHTML;
}
