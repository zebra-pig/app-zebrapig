import type { ServiceContext } from "../context/service.context";
import type { HonoEnv } from "../env/env";

/**
 * Lazily instantiates a service and memoizes it on the Hono request context.
 * The request context doubles as the DI container: each service occupies a
 * nullable slot in HonoEnv["Variables"] and is created once per request.
 * (Copied 1:1 from the filmkit API convention.)
 */
export function useService<N extends keyof HonoEnv["Variables"]>(
  c: ServiceContext,
  name: N,
  initializer: () => NonNullable<HonoEnv["Variables"][N]>,
): NonNullable<HonoEnv["Variables"][N]> {
  if (!c.get(name)) {
    c.set(name, initializer());
  }
  return c.get(name) as NonNullable<HonoEnv["Variables"][N]>;
}
