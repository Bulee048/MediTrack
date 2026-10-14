import dns from 'node:dns';
import type { LookupFunction } from 'node:net';

// Node's socket lookup uses the OS resolver, unlike Atlas SRV discovery.
// Only an explicit development/test DNS override enables this fallback.
export const databaseLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, options, (error, address, family) => {
    if (!error || !['ENOTFOUND', 'EAI_AGAIN'].includes(error.code ?? '') || !process.env.TEST_DNS_SERVERS || process.env.NODE_ENV === 'production') {
      callback(error, address, family); return;
    }
    dns.resolve4(hostname, (fallbackError, addresses) => {
      if (fallbackError || !addresses?.length) { callback(fallbackError ?? error, ''); return; }
      callback(null, options.all ? addresses.map(value => ({ address: value, family: 4 })) : addresses[0], 4);
    });
  });
};
