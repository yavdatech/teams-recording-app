variable "app_name" {
  description = "Display name for the Azure AD application"
  type        = string
  default     = "teams-recording-app"
}

variable "secret_duration_days" {
  description = "How many days the generated client secret should be valid for"
  type        = number
  default     = 365
}
