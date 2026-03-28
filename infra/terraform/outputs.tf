output "application_id" {
  description = "Application (client) ID of the created Azure AD application"
  value       = azuread_application.app.application_id
}

output "application_object_id" {
  description = "Object ID of the Azure AD application"
  value       = azuread_application.app.object_id
}

output "service_principal_object_id" {
  description = "Object ID of the created service principal"
  value       = azuread_service_principal.sp.object_id
}

output "client_secret_value" {
  description = "Client secret value (sensitive). Save it securely after creation."
  value       = azuread_application_password.client_secret.value
  sensitive   = true
}
