app_name = "gear"
app_title = "Gear Management"
app_publisher = "Zebra & Pig"
app_description = "Equipment / gear tracking with NFC-friendly opaque tokens."
app_email = "info@zebrapig.com"
app_license = "MIT"

# Keep the app sleek: no custom desk pages, no bundled JS, no scheduler jobs.
# All controller logic lives in the doctype controllers themselves.

# Ship the `gear_abbr` custom field on Item Group (drives CAM-02 naming).
after_migrate = ["gear.setup.ensure_custom_fields"]
