// src/lib/metaHelpers.ts

/**
 * Reads the fbc and fbp cookies required by Meta for deduplication.
 * This is designed to run client-side.
 */
export function getMetaBrowserIDs() {
  if (typeof document === 'undefined') {
    return { fbc: '', fbp: '' };
  }
  
  const cookies = document.cookie.split(';');
  let fbc = '';
  let fbp = '';

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie.startsWith('_fbc=')) {
      fbc = trimmedCookie.substring(5);
    } else if (trimmedCookie.startsWith('_fbp=')) {
      fbp = trimmedCookie.substring(5);
    }
  }

  // The fbc value must be URL encoded when retrieved from the cookie
  return {
    fbc: fbc ? encodeURIComponent(fbc) : '',
    fbp: fbp
  };
}