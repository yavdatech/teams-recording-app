/*
  Creates an Azure AD application, a service principal and a client secret.
  NOTE: This Terraform template only creates the app and secret. Granting
  Microsoft Graph Application permissions (admin consent) requires a tenant
  administrator. See the `infra/scripts/grant-graph-permissions.sh` script
  that queries Microsoft Graph and applies the appRole (application) permissions.
*/

resource "azuread_application" "app" {
  display_name = var.app_name
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_service_principal" "sp" {
  application_id = azuread_application.app.application_id
}

resource "azuread_application_password" "client_secret" {
  application_object_id = azuread_application.app.object_id
  display_name          = "${var.app_name}-secret"
  end_date_relative     = "${tostring(var.secret_duration_days * 24)}h"
}
