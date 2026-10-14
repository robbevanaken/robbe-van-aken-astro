# Email on robbevanaken.be: setup checklist

The domain is at Combell; the mail can live there too. The site shows `hello@robbevanaken.be` (since 14 Oct 2026); the
contact form still mails to `robbe.vanaken@gmail.com` (`TO` in `public/api/contact.php`) until the mailbox works.

## Which address

- `robbe@robbevanaken.be`: personal, trusted at once (the safe choice for a freelancer)
- `build@robbevanaken.be`: echoes "Let's build what comes next" in the footer
- `craft@robbevanaken.be`: a nod to "Digital craftsman" and the R (harder to say on the phone)
- `hi@robbevanaken.be`: shorter and lighter than hello@

(Other ideas, as aliases later if wanted.)

- [x] Address chosen: `hello@robbevanaken.be`

## 1. Mailbox or forwarding

- [ ] A small **Combell mailbox** (forwarding alone can't send *as* the address from Gmail: that needs a mailbox with
      SMTP)
- Alternative: **Google Workspace** (~€7/month) to work in Gmail itself on the domain

## 2. Set up in the Combell control panel (the domain → email)

- [ ] Create the mailbox `hello@`
- [ ] Alias on the same mailbox: **`website@`** (the contact form's sender: `FROM` in
      `public/api/contact.php`)

## 3. DNS (normally set by Combell when domain + mail are both there: check)

- [ ] **MX** records point to Combell's mail servers
- [ ] **SPF** includes Combell's mail servers
- [ ] **DKIM** on
- [ ] **DMARC** record, `p=none` to start
- Without these the contact form's mails land in spam (also in `HOSTING.md`, step 4)

## 4. Link to Gmail (to keep working there)

- [ ] **Receive**: forward the Combell mailbox to Gmail, or Gmail → Settings → Accounts → "Check mail from other
      accounts"
- [ ] **Send**: Gmail → Settings → Accounts → **"Send mail as"** → add the new address with the **Combell mailbox's SMTP
      server and password** (found with the mailbox in Combell)

## 5. Test

- [ ] Mail the new address from your phone, reply from Gmail with the new address as the sender
- [ ] Check it doesn't land in the recipient's spam

## 6. Then in the site (once the mailbox works)

- [x] `hello@robbevanaken.be` everywhere in the site: footer, contact details + popup, JSON-LD, privacy notice, the
      form's error message (`email` in `site.ts`, `contactPage` + `privacyPage.company` in `pages.ts`)
- [ ] `TO` in `public/api/contact.php` → the new address (only once the mailbox receives, or form mails get lost)
- [ ] Test the contact form on the live site: the mail arrives, Reply-To is the visitor
