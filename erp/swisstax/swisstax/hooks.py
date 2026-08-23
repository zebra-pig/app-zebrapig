app_name = "swisstax"
app_title = "Swiss Tax"
app_publisher = "Zebra & Pig"
app_description = (
	"Swiss statutory paperwork for ERPNext: the salary certificate (Formular 11) "
	"and the simplified annual statement for self-employed persons (Art. 957 Abs. 2 OR)."
)
app_email = "info@zebrapig.com"
app_license = "MIT"

# Same philosophy as the `gear` app: no custom desk pages, no bundled JS beyond the
# doctype client scripts, no scheduler jobs. Controllers own their logic; the print
# formats are thin Print Format records that {% include %} a template from this app.

# `ahv_number` on Employee (Formular 11, Buchstabe C) and the private-account markers
# on Account (Privatentnahmen / Privateinlagen) are shipped as custom fields.
after_migrate = ["swisstax.setup.after_migrate"]

doctype_js = {
	"Salary Component": "public/js/salary_component.js",
}
