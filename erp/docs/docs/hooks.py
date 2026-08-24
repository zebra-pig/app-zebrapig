app_name = "docs"
app_title = "Business Documents"
app_publisher = "Zebra & Pig"
app_description = "Print formats for the documents Zebra & Pig sends out."
app_email = "info@zebrapig.com"
app_license = "MIT"

# The print formats are standard records that {% import %} one macro library, so a
# change to the letterhead or the footer lands on every document at once.
jinja = {
	"methods": [
		"docs.utils.context.document_context",
		"docs.utils.qrbill.qr_bill_svg",
	],
}
