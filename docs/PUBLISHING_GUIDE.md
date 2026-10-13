# SolveDock — Marketplace Publishing Guide

This guide details the procedure for publishing **SolveDock** to the Visual Studio Marketplace.

---

## 1. Prerequisites

1. **Microsoft Account:** Needed to sign in to Azure DevOps and the VS Code Marketplace.
2. **Azure DevOps Organization:**
   - Go to [dev.azure.com](https://dev.azure.com).
   - Create a free personal organization if you don't already have one.
3. **Personal Access Token (PAT):**
   - In Azure DevOps, click **User settings** (top right) -> **Personal access tokens**.
   - Click **+ New Token**.
   - Under **Organization**, select **All accessible organizations**.
   - Under **Scopes**, select **Custom defined**, scroll to **Marketplace**, and check **Acquire** and **Manage**.
   - Copy the generated token securely.

---

## 2. Create the Publisher

1. Go to the [VS Code Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
2. Click **Create publisher**.
3. Set your unique Publisher ID (e.g. `solvedock` or your chosen namespace matching `package.json`).
4. Update the `"publisher"` field in `package.json` if your registered ID differs from `solvedock`.

---

## 3. Verify Authentication Locally

Login with your Personal Access Token:
```bash
npx @vscode/vsce login <your-publisher-name>
```
When prompted, paste your Azure DevOps PAT.

---

## 4. Publish the Release

Once logged in, publish directly from the project root:
```bash
# Verify all tests pass
npm test

# Publish to the VS Code Marketplace
npx @vscode/vsce publish
```

Alternatively, you can upload the packaged `.vsix` file manually:
1. Open [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage).
2. Click your publisher name.
3. Click **New extension** -> **Visual Studio Code**.
4. Drag and drop `solvedock-0.1.0.vsix`.

---

## 5. Post-Publication Verification

1. Wait 5-10 minutes for marketplace validation and virus scanning to finish.
2. In VS Code, open the Extensions view (`Ctrl+Shift+X`).
3. Search for `SolveDock`.
4. Install directly from the marketplace and verify:
   - Sidebar displays correctly.
   - Creating a solution writes to `.solvedock/solutions/`.
   - Search retrieves saved solutions.
