const mongoose = require("mongoose");
const { Schema } = mongoose;

const composerSchema = new Schema(
	{
		name: {
			type: String,
			unique: true,
		},
		born: {
			type: Number,
			min: 0,
			max: 2025,
		},
		death: Number,
		era: String,
		bio: String,
		notableWorks: [String],
	},
	{ collection: "composers" }
);

const ComposerModel = mongoose.model("Composer", composerSchema);

module.exports = ComposerModel;
