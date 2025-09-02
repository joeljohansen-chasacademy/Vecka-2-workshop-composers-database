const WorkModel = require("./models/work");
const ComposerModel = require("./models/composer");

const createWork = async (workData) => {
	return WorkModel.create(workData);
};

const findWork = async (id) => {
	return WorkModel.findById(id);
};

const findWorks = async () => {
	return WorkModel.find();
};

const updateWork = async (id, workData) => {
	return WorkModel.findByIdAndUpdate(id, workData, {
		new: true,
		runValidators: true,
	});
};

const deleteWork = async (id) => {
	return WorkModel.findByIdAndDelete(id);
};

const findWorksWithFilter = async (filter) => {
	return WorkModel.find(filter).lean();
};

const findWorksByComposer = async (composerId) => {
	return WorkModel.find({ composerId }).lean();
};

const composerExists = async (composerId) => {
	return ComposerModel.exists({ _id: composerId });
};

module.exports = {
	createWork,
	findWork,
	findWorks,
	updateWork,
	deleteWork,
	findWorksWithFilter,
	findWorksByComposer,
	composerExists,
};
