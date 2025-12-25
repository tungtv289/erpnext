// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors and contributors
// For license information, please see license.txt

frappe.query_reports["Stock Balance"] = {
	filters: [
		// {
		// 	fieldname: "from_date",
		// 	label: __("From Date"),
		// 	fieldtype: "Date",
		// 	width: "80",
		// 	reqd: 1,
		// 	default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
		// },
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			width: "80",
			reqd: 1,
			default: frappe.datetime.get_today(),
		},
		{
			fieldname: "item_group",
			label: __("Item Group"),
			fieldtype: "Link",
			width: "80",
			options: "Item Group",
		},
		{
			fieldname: "item_code",
			label: __("Items"),
			fieldtype: "MultiSelectList",
			width: "80",
			options: "Item",
			get_data: async function (txt) {
				let item_group = frappe.query_report.get_filter_value("item_group");

				let filters = {
					...(item_group && { item_group }),
					is_stock_item: 1,
				};

				let { message: data } = await frappe.call({
					method: "erpnext.controllers.queries.item_query",
					args: {
						doctype: "Item",
						txt: txt,
						searchfield: "name",
						start: 0,
						page_len: 10,
						filters: filters,
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
			fieldname: "warehouse",
			label: __("Warehouses"),
			fieldtype: "MultiSelectList",
			width: "80",
			options: "Warehouse",
			get_data: (txt) => {
				let warehouse_type = frappe.query_report.get_filter_value("warehouse_type");
				let company = frappe.query_report.get_filter_value("company");

				let filters = {
					...(warehouse_type && { warehouse_type }),
					...(company && { company }),
				};

				return frappe.db.get_link_options("Warehouse", txt, filters);
			},
		},
		// {
		// 	fieldname: "show_stock_ageing_data",
		// 	label: __("Show Stock Ageing Data"),
		// 	fieldtype: "Check",
		// },
		// {
		// 	fieldname: "include_zero_stock_items",
		// 	label: __("Include Zero Stock Items"),
		// 	fieldtype: "Check",
		// 	default: 1,
		// }
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

		if (column.fieldname == "out_qty" && data && data.out_qty > 0) {
			value = "<span style='color:red'>" + value + "</span>";
		} else if (column.fieldname == "in_qty" && data && data.in_qty > 0) {
			value = "<span style='color:green'>" + value + "</span>";
		}

		return value;
	},
};

erpnext.utils.add_inventory_dimensions("Stock Balance", 8);
