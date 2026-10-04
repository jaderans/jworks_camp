# Connecting the team (cloud sync)

Without cloud sync, JoshWorks Campaigns works on one device. With it, every designer opens the same calendar on their own phone or laptop. Comments, approvals and status changes arrive live, and everything is backed up.

Sync runs on your own Firebase project. Use a **new project, separate from JoshWorks POS**, so the two apps never share accounts or data. The free Spark plan is enough: 50,000 reads and 20,000 writes a day, which a five-person team won't reach.

## 1. Create the Firebase project (owner, once, about 10 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com), sign in with the JoshWorks Google account and choose **Add project** (for example `joshworks-campaigns`). Google Analytics isn't needed.
2. **Build → Authentication → Get started**, then turn on **Email/Password**.
3. **Build → Firestore Database → Create database**. Choose **asia-southeast1 (Singapore)**, the closest location to Iloilo, and start in **production mode**.
4. In Firestore, open **Rules**, replace everything with the JoshWorks rules and click **Publish**. Copy the rules from **Settings → Cloud sync → Copy the security rules** in the app, or from [`firebase/firestore.rules`](../firebase/firestore.rules).
5. **Project settings → Your apps → Web (`</>`)**, register an app (no hosting needed) and copy the `firebaseConfig` block.

The `firebaseConfig` values aren't secret: they only say which project to talk to. The security rules decide who can read and write.

## 2. Connect the owner's device

1. In the app: **Settings → Cloud sync and team accounts**.
2. Paste the `firebaseConfig` block. Keep the team name `joshworks`; every device on the team uses the same one.
3. Click **Connect this device**, then create the owner account with the email the team knows you by. Verify it from the email Firebase sends.

Everything already on this device uploads once you're signed in.

## 3. Invite the designers

1. **Team → Add person** (or edit someone the planner import already added). Enter their **email** and choose a role:
   - **Designer**: the calendar, board, ideas, trends, results and the assistant, plus campaigns to view. They create and edit content, comment and ask for approval, including on client posts. They don't get the Clients, Packages or Contracts pages, and never see rates.
   - **Manager**: everything a designer can do, plus clients, campaigns, funnels, packages, proposals and contracts.
   - **Owner**: everything, including settings, team access and the activity log.
2. Click the **link icon** next to their name. On a phone it opens the share sheet; on a computer it copies the invite so you can paste it in Messenger or Viber.
3. They open the link on their phone, create an account **with that same email** and verify it. Their device then fills with the team's data.

To pause someone, edit them and switch them off. Their access stops right away, and their posts and comments stay.

## What syncs and what doesn't

| Syncs to the team | Stays on the device |
| --- | --- |
| Posts, comments, approvals, ideas, scripts, the caption bank | The Claude API key |
| Campaigns, funnels, trends, hooks, results | Assistant chats |
| Clients, packages, proposals, contracts (managers and owner only) | Per-device choices: light or dark, the collapsed menu, the brand filter |
| Settings: business, voice, rhythm, checklist (designers can't see rates or contract terms; only the owner sees the PIN) | |

Nothing waits for the internet: changes save on the device first and upload when there's a connection. If two people edit the same post, the latest save wins, and the activity log shows who changed what.

## If something goes wrong

- **"Missing or insufficient permissions"**: the rules weren't published, or this person's email isn't on the Team page with access. Check step 1.4 and the badge next to their name on the Team page.
- **The domain isn't authorized**: in Firebase, go to **Authentication → Settings → Authorized domains** and add `jaderans.github.io`.
- **Forgot the password**: use **Forgot password** on the sign-in form.
- **Moving to a new phone**: open the app, open the invite link again (or ask the owner for a new one) and sign in.
