const mongoose = require("mongoose");
const { Schema } = mongoose;

const workSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		year: { type: Number },
		type: { type: String, trim: true },
		composerId: {
			type: Schema.Types.ObjectId,
			ref: "Composer",
			required: true,
		},
		durationMin: { type: Number },
		instrumentation: { type: String },
		notes: { type: String },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Work", workSchema);
