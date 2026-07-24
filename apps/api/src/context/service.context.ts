import type { Context } from "hono";
import type { HonoEnv } from "../env/env";

/** The Hono request context, aliased so services don't import Hono directly. */
export type ServiceContext = Context<HonoEnv>;
