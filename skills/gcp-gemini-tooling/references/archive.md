# gcp-gemini-tooling Historical & Evergreen Reference Vault

This archive vault contains foundational developer tooling guides, codelabs, repositories, and official documentation for `gcp-gemini-tooling`.

---

### 💎 Evergreen Tooling & Infrastructure-as-Code Masterclasses
- **Terraform IAM Safety Fundamentals (`*_iam_member` vs `*_iam_binding` vs `*_iam_policy`)**:
  - `*_iam_policy`: Overwrites the ENTIRE IAM policy for the resource. Authoritative and destructive.
  - `*_iam_binding`: Overwrites all members assigned to a specific role. Destructive to existing members.
  - `*_iam_member`: Additive only. Grants a role to a single member without mutating others. **Always standard in multi-team GCP environments.**

- **Keyless CI/CD with Workload Identity Federation (WIF)**:
  - Eliminating downloadable Service Account JSON keys from GitHub Actions, GitLab CI, and Terraform Cloud.
  - Short-lived token exchange via OIDC tokens exchanging for GCP IAM credentials.

---

### 🛠️ Interactive Codelabs & Bootcamps
- [[Codelab]: Gemini CLI: Code & Create with an Open-Source Agent](https://www.deeplearning.ai/short-courses/gemini-cli-code-and-create-with-an-open-source-agent/)
- [[Codelab]: Getting Started with Google Antigravity](https://codelabs.developers.google.com/getting-started-google-antigravity)

---

### 🐙 Official Repositories & Starter Kits
- [Gemini CLI Github Repo](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI Release v0.20.0 Discussion](https://github.com/google-gemini/gemini-cli/discussions/14903)
- [Gemini CLI Weekly Update v0.22.0: Gemini 3 Free Tier & Colab](https://github.com/google-gemini/gemini-cli/discussions/15488)
- [The Gemini CLI Tutorial Series](https://medium.com/google-cloud/gemini-cli-tutorial-series-77da7d494718)
- [DeepLearning.ai: Claude Code: A Highly Agentic Coding Assistant](https://learn.deeplearning.ai/courses/claude-code-a-highly-agentic-coding-assistant/lesson/66b35/introduction)
- [Kaggle Whitepaper: The New SDLC with Vibe Coding](https://www.kaggle.com/whitepaper-the-new-SDLC-with-vibe-coding)

---

### 📖 Official Google Documentation & Courses
- [Gemini Code Assist overview](https://developers.google.com/gemini-code-assist/docs/overview)
- [Set up Gemini Code Assist Standard and Enterprise](https://cloud.google.com/gemini/docs/discover/set-up-gemini#purchase-subscription)
- [Gemini Code Assist code customization](https://cloud.google.com/gemini/docs/codeassist/use-code-customization)
- [Gemini CLI Extensions Gallery](https://geminicli.com/extensions/)
- [Gemini CLI Session Management](https://geminicli.com/docs/cli/session-management/)
- [Gemini Code Assist](https://cloud.google.com/gemini/docs/discover/set-up-gemini)
- [Available in Your Favorite IDEs](https://codeassist.google/#available-in-your-favorite-ides-and-platforms)
- [Download and Deploy Terraform](https://docs.cloud.google.com/application-design-center/docs/download-and-deploy#export_terraform_code)
- [Import Components](https://docs.cloud.google.com/application-design-center/docs/import-components)
