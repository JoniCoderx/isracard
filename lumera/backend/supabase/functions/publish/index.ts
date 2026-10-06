import { handler } from "./handler.ts";
import { makeDeps } from "../_shared/deps.ts";

const deps = makeDeps();
Deno.serve((req) => handler(req, deps));
