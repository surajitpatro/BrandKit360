import { authRouter } from "./auth-router";
import { plansRouter } from "./plans-router";
import { brandsRouter } from "./brands-router";
import { storageRouter } from "./storage-router";
import { assetsRouter } from "./assets-router";
import { aiRouter } from "./ai-router";
import { imageryRouter } from "./imagery-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  plans: plansRouter,
  brands: brandsRouter,
  storage: storageRouter,
  assets: assetsRouter,
  ai: aiRouter,
  imagery: imageryRouter,
});

export type AppRouter = typeof appRouter;
