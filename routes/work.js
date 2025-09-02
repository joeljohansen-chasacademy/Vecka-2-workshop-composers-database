const express = require("express");
const {
	createWork,
	findWork,
	findWorks,
	updateWork,
	deleteWork,
	findWorksWithFilter,
	findWorksByComposer,
	composerExists,
} = require("../db/workCrud");
const router = express.Router();

// POST /works
router.post("/", async (req, res) => {
	try {
		const {
			title,
			year,
			type,
			composerId,
			durationMin,
			instrumentation,
			notes,
		} = req.body;
		if (!title || !composerId)
			return res
				.status(400)
				.json({ error: "title and composerId are required" });

		// valfritt: säkerställ att composer finns
		const exists = await composerExists(composerId);
		if (!exists) return res.status(404).json({ error: "Composer not found" });

		const work = await createWork({
			title,
			year,
			type,
			composerId,
			durationMin,
			instrumentation,
			notes,
		});
		res.status(201).json(work);
	} catch (err) {
		console.error(err);
		res.status(400).json({ error: "Validation error", details: err.message });
	}
});

// GET /works?composerId=&year=&type=&q=
router.get("/", async (req, res) => {
	try {
		const { composerId, year, type, q } = req.query;
		const filter = {};
		if (composerId) filter.composerId = composerId;
		if (year) filter.year = Number(year);
		if (type) filter.type = type;
		if (q) filter.title = { $regex: q, $options: "i" };

		const works = await findWorksWithFilter(filter);
		res.json(works);
	} catch (err) {
		console.error(err);
		res.status(400).json({ error: "Bad query" });
	}
});

// GET /works/by-composer/:composerId — alla verk för en kompositör localhost:3000/works/by-composer/68b04f43145fd6d46af6f84c
router.get("/by-composer/:composerId", async (req, res) => {
	try {
		const works = await findWorksByComposer(req.params.composerId);
		res.json(works);
	} catch (err) {
		console.error(err);
		res.status(400).json({ error: "Invalid composerId" });
	}
});

module.exports = router;
