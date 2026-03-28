# Plan: IaC for Azure AD App Registration & MS Graph Permissions

Date: 2026-03-28
Author: GitHub Copilot (assistant)

Goal
- Generate Infrastructure-as-Code to provision an Azure AD application (app registration + service principal), create credentials (client secret), and provide an automated script to add and grant the Microsoft Graph Application permissions required by this project.

Why
- Automating the app registration reduces manual steps and provides repeatable, auditable configuration. Admin consent for tenant-level application permissions still requires a tenant administrator to approve/grant consent.

Scope
- Create Terraform template that:
  - Creates an Azure AD application and service principal
  - Creates a client secret (or supports using a certificate)
  - Emits outputs: `application_id`, `service_principal_object_id`, `client_secret` (printed only during provisioning)
- Provide a small shell and PowerShell script that:
  - Adds the Microsoft Graph application permissions required by this repo
  - Grants admin consent for those permissions (requires tenant admin account)
- Optionally provide a Bicep snippet performing the same app/service-principal creation (no portal clicks)
- Place artifacts under `infra/` (Terraform + scripts + optional Bicep)

Assumptions & constraints
- The provisioning account (or the principal executing the CI job) must have rights to create App Registrations and Service Principals in the tenant.
- Admin consent (granting Application permissions) must be executed by a tenant administrator. The generated script uses Azure CLI (`az`) and may require the `AzureAD` or `Microsoft Graph` access depending on CLI version.
- For production, prefer Managed Identity (no client secret) and store secrets in Key Vault.

Planned artifacts
- `infra/terraform/app-registration.tf` — Terraform template creating the app + service principal + secret
- `infra/terraform/outputs.tf` — Terraform outputs
- `infra/scripts/grant-graph-permissions.sh` — Bash script using Azure CLI to add permissions and grant admin consent
- `infra/scripts/grant-graph-permissions.ps1` — PowerShell variant for Windows
- `infra/bicep/app-registration.bicep` — Optional Bicep example (if you prefer Bicep)

High-level steps
1. Generate the Terraform and scripts files under `infra/` (I will create these files).
2. I will commit and push the changes to `origin/main` in a feature commit.
3. You (tenant admin) run the grant script locally (or I can provide guidance for executing from a secure admin host). This will add the required Graph permissions and grant admin consent.

Required approval
- Please reply with one of: `approve` | `modify` | `cancel`.
- `approve` — I will generate the IaC files and commit them.
- `modify` — reply with changes you want in the plan (e.g., only Terraform, or only Bicep, or different file paths).

Safety notes
- The scripts will not auto-run admin consent; they only provide the commands. Running the grant script performs tenant-level changes and must be executed intentionally by an administrator.

Outputs & verification
- After generation I will provide the file paths and commit link. I can also optionally run `terraform plan` locally if you want but that requires CLI and tenant authentication.

Next
- Reply `approve` to proceed with generating the IaC artifacts and committing them to `origin/main`.

Status: Draft — awaiting user approval
