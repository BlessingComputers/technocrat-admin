This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Branching & Pushing

- **Remote:** `origin` → `https://github.com/blessing-computers/admin-blessingcomputers.git`
- **Working branch:** `dev` — all new updates are committed here and pushed to the remote.

### Push the `dev` branch to the remote

The first time you push `dev`, set it to track the remote so future pushes are just `git push`:

```bash
# make sure you're on dev
git checkout dev

# first push — creates dev on the remote and links it
git push -u origin dev
```

After the first push, day-to-day updates are simply:

```bash
git add .
git commit -m "your message"
git push
```

> If GitHub asks you to authenticate, sign in as the account that has push
> access to `blessing-computers/admin-blessingcomputers` (use a Personal Access
> Token as the password for HTTPS). Commits are authored as
> **blessing-computers <hosting@blessingcomputers.com>**.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
