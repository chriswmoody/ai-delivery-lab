# How to run this project locally

Follow these steps in order. Each one should take about 1 minute.

---

## Step 1 — Open the project in VS Code

1. Open VS Code
2. Go to **File → Open Folder**
3. Navigate to and select the `ai-delivery-lab` folder
4. VS Code will open the project

---

## Step 2 — Open the terminal inside VS Code

1. In VS Code, go to **Terminal → New Terminal** (or press `` Ctrl + ` ``)
2. A terminal panel will open at the bottom of the screen

---

## Step 3 — Install dependencies

In the terminal, type this exactly and press Enter:

```
npm install
```

This downloads all the code libraries the project needs. It only needs to run once. You'll see a lot of text scroll by — that's normal. Wait for it to finish (usually 30–60 seconds).

---

## Step 4 — Add your Anthropic API key

1. In VS Code's file explorer (left sidebar), find the file called `.env.example`
2. Right-click it and select **Copy**
3. Right-click the `ai-delivery-lab` folder and select **Paste**
4. Rename the pasted file to `.env.local` (remove the `.example` part)
5. Open `.env.local` and replace `your_api_key_here` with your actual Anthropic API key

It should look like:
```
ANTHROPIC_API_KEY=sk-ant-...your key here...
```

> ⚠️ This file is private — it's in `.gitignore` so it will never be uploaded to GitHub.

---

## Step 5 — Install the Netlify CLI (one-time setup)

The Netlify CLI lets you run the backend functions (the part that calls the AI) on your own computer.

In the terminal, type:

```
npm install -g netlify-cli
```

Wait for it to finish.

---

## Step 6 — Start the app

In the terminal, type:

```
netlify dev
```

After a few seconds you'll see something like:

```
◈ Server now ready on http://localhost:8888
```

Open your browser and go to: **http://localhost:8888**

You should see the AI Delivery Lab landing page.

---

## Every time you come back

You only need Steps 1–2 each time (open VS Code, open terminal). Then just run:

```
netlify dev
```

---

## Stopping the app

In the terminal, press **Ctrl + C** to stop the local server.

---

## If something doesn't work

Tell Claude what error message you're seeing and we'll fix it.
