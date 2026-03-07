// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.query_reports["Stock Ledger"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			reqd: 1,
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,
		},
		{
			fieldname: "io_type",
			label: __("I/O type"),
			fieldtype: "Autocomplete",
			options: [
				{ value: "IN", label: __("I/O type - In") },
				{ value: "OUT", label: __("I/O type - Out") }
			],
			default: "IN"
		},
		{
			fieldname: "warehouse",
			label: __("Warehouses"),
			fieldtype: "MultiSelectList",
			options: "Warehouse",
			get_data: function (txt) {
				const company = frappe.defaults.get_user_default("Company");

				return frappe.db.get_link_options("Warehouse", txt, {
					company: company,
				});
			},
		},
		{
			fieldname: "item_code",
			label: __("Items"),
			fieldtype: "MultiSelectList",
			options: "Item",
			get_data: async function (txt) {
				let { message: data } = await frappe.call({
					method: "erpnext.controllers.queries.item_query",
					args: {
						doctype: "Item",
						txt: txt,
						searchfield: "name",
						start: 0,
						page_len: 10,
						filters: {},
						as_dict: 1,
					},
				});
				data = data.map(({ name, ...rest }) => {
					return {
						value: name,
						description: Object.values(rest),
					};
				});

				return data || [];
			},
		},
		{
			fieldname: "item_group",
			label: __("Item Group"),
			fieldtype: "Link",
			options: "Item Group",
		},
		{
			fieldname: "voucher_no",
			label: __("Voucher #"),
			fieldtype: "Data",
		},
		{
			fieldname: "include_uom",
			label: __("Include UOM"),
			fieldtype: "Link",
			options: "UOM",
		}
	],
	formatter: function (value, row, column, data, default_formatter) {
		if (column.fieldtype === "Float" || column.fieldtype === "Currency") {
			// use raw data value if available, fallback to value string
			const raw = data && data[column.fieldname];
			const num = parseFloat(raw !== undefined && raw !== null && raw !== "" ? raw : String(value).replace(/,/g, ""));
			if (isNaN(num)) {
				value = default_formatter(value, row, column, data);
			} else {
				const sign = num < 0 ? "-" : "";
				const abs = Math.abs(num);
				// format with up to 3 decimals, trim trailing zeros (so .000 is removed)
				const parts = abs.toFixed(3).split(".");
				const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				let frac = parts[1] || "";
				frac = frac.replace(/0+$/, ""); // remove trailing zeros
				const formatted = frac ? intPart + "." + frac : intPart;
				value = sign + formatted;
			}
		} else {
			value = default_formatter(value, row, column, data);
		}

		if (column.fieldname == "in_out_qty") {
			if (data && data.in_out_qty < 0) {
				value = "<span style='color:red'>" + value + "</span>";
			} else {
				value = "<span style='color:green'>" + value + "</span>";
			}
		}

		return value;
	},
};

erpnext.utils.add_inventory_dimensions("Stock Ledger", 10);
