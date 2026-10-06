# SILAVU admin: how to

Open **https://jonicoderx.github.io/isracard/admin/** and sign in. Every screen can be bookmarked
or reloaded. The language switch (English / עברית) is at the foot of the menu.

**The one rule:** *Save draft* keeps your work private. Nothing changes on the site until you
**Publish**. After publishing, the site rebuilds itself, usually within 10–15 minutes; the top button and
**History → Releases** show *Building…* and then *Live on the site*.

---

### Change a product's photographs
1. **Products** → the piece → **Photographs & film**.
2. **Add photographs from the library** → drop files in (or *choose files*) → tick them → **Use**.
   JPEG/PNG/WebP/AVIF, 1254 pixels or more on the short side for sharp results. Originals are kept
   exactly as you upload them.
3. The **first** photograph is the card's face, the second is what it turns to. Use ↑ ↓ (or drag)
   to reorder. Write a short description of each for people who cannot see it.
4. **Preview** → **Publish**.

### Change a price
1. **Products** → the piece → **Price & visibility**.
2. Choose *Price on request*, *A set price* or *A starting price*. Type the amount in each currency
   you quote (nothing is converted automatically). "The site will say" shows the exact words.
3. **Publish**. The card, the piece's window, its page and its search data all change together.

To hide a piece, switch off **Shown in the collection**. To remove it, **Archive** (nothing is
deleted; **Restore** brings it back). Cost and supplier notes go under **Internal** (owner only,
never published).

### Change words on the site
* **Pages & text → Page text**: every sentence, label and button of the home page in English and
  Hebrew. Type part of the sentence in *Find a text*, change it, **Save draft**, **Preview this chapter**.
  *Back to the original* undoes a change. Put \*stars\* around words to set them in italic.
* **Pages & text → Home chapters**: hide or show chapters; add a **text band** between chapters.
* **Pages & text → About / Policies**: the About letter and the house documents.
* **Pages & text → Pages → New page**: a new page in the style of the house documents, with its own
  address and (if you like) a link under *Client care*.
* **Pages & text → Menus**: add links to the top menu or the footer; record a moved page.
* **Settings**: email, WhatsApp, phone, social accounts (only confirmed ones), an announcement bar,
  and the try-on.
* **Languages & SEO**: the home page's title and description in search results, the picture shown
  when the site is shared, and the French, Arabic and Russian translations.

### The Line (bracelet builder)
**The Line**: which shapes, origins, metals, carat weights and wrist sizes are offered, and what the
builder opens on. The estimate is shown only when you mark its figures approved and dated; otherwise
the builder says *Price on request*. Enquiries for something no longer offered are refused, and
earlier enquiries keep the design they were made with.

### Enquiries and quotes
* **Enquiries**: every enquiry the site saved, newest first (the email to the house is a copy).
  Open one to see who wrote, what they designed, and their message. Set the **status**, assign it,
  pick a **follow-up** date, add **notes** (team only).
* **Make a quote** from an enquiry: what it is for, amount, currency, valid until, a note for the
  customer. **Customer's copy** opens a clean page to print or save as PDF (internal notes never
  appear on it). **Mark as sent** fixes the amount; to offer something else, withdraw it and make a
  new quote. A quote keeps the piece and design as they were when it was made.
* **Customers**: everyone who has written, merged by email or phone; export to CSV; anonymise on request.
* A WhatsApp, email or phone **click** on the site is counted in Analytics; it is not a message.

### Visit figures
**Analytics**: visits, returning browsers, pieces opened, designs started, enquiries saved, contact
clicks, with a comparison to the period before; where visits came from, pages, pieces, devices,
languages; the two paths from browsing to enquiry. Filter by device, source or piece; export CSV.
Only visitors who allowed counting are included, the house's own browsers never are, and there is
no history from before the backend was connected. Figures are anonymous; no one can be identified.

### Go back to an earlier version
* One page: open it → **Earlier versions** (or the **History** tab on a product) → **What changed**
  to compare → **Use this version** → **Publish**.
* The whole site: **History & backups → Releases** → **Restore** next to the release you want.
  Nothing is deleted; the restore is itself a new release.

### Backups
A full private backup is made every night. **History & backups → Backups → Make an export now**
gives you a copy to keep (the link works for ten minutes). Restoring is described in ADMIN_SETUP.md.

### The team
**Team → Invite someone** with a role (Owner, Editor, Support, Analyst). While the site sends no
email, also type a password: the account is ready at once, and you give them the password.
**Set a password** on the list replaces a forgotten one. Tick **Authenticator
required** to make someone use an authenticator app. **Remove** ends their access at once.
Set up your own authenticator under **Account**.

### If something goes wrong
* *"Someone else saved this page meanwhile"*: choose **Load their version** or **Keep mine on top of theirs**.
* *"The build did not start"* / *"The build failed"*: the site still shows the previous version.
  **History → Releases → Start the build again**. Nothing you published is lost.
* *"The connection dropped"*: your unsaved work stays on this device; reload when you are back
  online and press **Save draft**.
