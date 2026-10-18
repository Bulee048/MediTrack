import dns from 'node:dns';
import type { LookupFunction } from 'node:net';

// Node's socket lookup uses the OS resolver, unlike Atlas SRV discovery.
// Only an explicit development/test DNS override enables this fallback.
const resolver = new dns.Resolver();
resolver.setServers((process.env.TEST_DNS_SERVERS || '8.8.8.8,1.1.1.1').split(','));

export const databaseLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, options, (error, address, family) => {
    if (!error) {
      callback(error, address, family);
      return;
    }
    resolver.resolve4(hostname, (fallbackError, addresses) => {
      if (fallbackError || !addresses?.length) {
        callback(fallbackError ?? error, '', 4);
        return;
      }
      callback(null, options.all ? addresses.map(value => ({ address: value, family: 4 })) : addresses[0], 4);
    });
  });
};
