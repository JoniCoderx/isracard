// Work on the admin locally:
//   node --experimental-strip-types test/dev.mjs
// starts a fresh database, the fake Supabase, builds the site once, and signs
// up a first owner (owner@silavu.test / "local-owner-password"). Everything is
// local and throwaway; nothing here touches a real project.
import { startStack } from "./stack.mjs";
const s = await startStack({});
await s.fake.bootstrapOwner("owner@silavu.test", "local-owner-password");
await s.siteBuild(null);
console.log(`\nadmin: ${s.adminUrl}\nowner: owner@silavu.test / local-owner-password\n`);
