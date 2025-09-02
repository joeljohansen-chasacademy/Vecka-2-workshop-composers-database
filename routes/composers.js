const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {
	createComposer,
	findComposersByBorn,
	findComposer,
	findComposers,
	updateComposer,
	deleteComposer,
	findComposersWithFilter,
	addWorkToComposer,
	removeWorkFromComposer,
	getComposerStats,
	findComposerWithWorks,
} = require("../db/composerCrud");

/*

Möjlig lösning för validering redan i API:et

const { body, query, param, validationResult } = require("express-validator");

// Middleware-kedja för POST /composers
const validateCreateComposer = [
  body("name").isString().trim().notEmpty().withMessage("name krävs"),
  body("born").isInt({ min: 800, max: 2100 }).withMessage("born måste vara ett årtal"),
  body("nationality").optional().isString().trim(),
  body("period").optional().isString().trim(),
];

router.post("/", validateCreateComposer, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation error", details: errors.array() });
  }
  const createdComposer = await createComposer(req.body);
  res.status(201).json(createdComposer);
});

const validateBornQuery = [
  query("startYear").isInt().toInt(),
  query("endYear").isInt().toInt(),
];

router.get("/born", validateBornQuery, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation error", details: errors.array() });
  }
  const composers = await findComposersByBorn(req.query.startYear, req.query.endYear);
  res.json(composers);
});
*/

// POST /composers
router.post("/", async (request, response) => {
	console.log(request.body);
	const createdComposer = await createComposer(request.body);
	response.status(201).json(createdComposer);
});

// POST /composers/:id/works  { "title": "Boléro (1928)" }
router.post("/:id/works", async (req, res) => {
	try {
		const { title } = req.body;
		if (!title || typeof title !== "string") {
			return res.status(400).json({ error: "title (string) is required" });
		}

		const updated = await addWorkToComposer(req.params.id, title);

		if (!updated) return res.status(404).json({ error: "Composer not found" });
		res.json(updated);
	} catch (err) {
		console.error(err);
		res.status(400).json({ error: "Invalid request", details: err.message });
	}
});

// GET /composers?name=&era=&born=&bornAfter=&bornBefore=&sort=
router.get("/", async (req, res) => {
	try {
		const { name, era, born, bornAfter, bornBefore, sort } = req.query;

		const filter = {};
		if (name) filter.name = { $regex: name, $options: "i" };
		if (era) filter.era = era;
		if (born) filter.born = Number(born);
		if (bornAfter || bornBefore) {
			filter.born = {};
			if (bornAfter) filter.born.$gt = Number(bornAfter);
			if (bornBefore) filter.born.$lt = Number(bornBefore);
		}

		const composers = await findComposersWithFilter(filter, sort);
		res.json(composers);
	} catch (err) {
		console.error(err);
		res.status(400).json({ error: "Bad query", details: err.message });
	}
});

// GET /composers/stats
router.get("/stats", async (req, res) => {
	try {
		const stats = await getComposerStats();
		res.json(stats);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to compute stats" });
	}
});

// DELETE /composers/:id/works  { "title": "Boléro (1928)" }
router.delete("/:id/works", async (req, res) => {
	try {
		const { title } = req.body;
		if (!title) return res.status(400).json({ error: "title is required" });

		const updated = await removeWorkFromComposer(req.params.id, title);

		if (!updated) return res.status(404).json({ error: "Composer not found" });
		res.json(updated);
	} catch (err) {
		console.error(err);
		res.status(400).json({ error: "Invalid request" });
	}
});

// GET /composers/:id/detail — composer + works (en enda request)
//Ett annat sätt är ju att hämta composer först och sen alla works (se works.js /by-composer/:id)
//Men med en lookup så gör vi allt i en enda query.
router.get("/:id/detail", async (req, res) => {
	try {
		const doc = await findComposerWithWorks(req.params.id);
		if (!doc) return res.status(404).json({ error: "Composer not found" });
		res.json(doc);
	} catch (err) {
		console.error(err);
		res.status(400).json({ error: "Invalid ID" });
	}
});

// GET /composers/:id
router.get("/:id", async (request, response) => {
	//Förutsätter att vi inte sätter vårt id själva utan att det sätts automatiskt av mongoDB
	try {
		const { id } = request.params;
		if (!mongoose.isValidObjectId(id)) {
			return response.status(400).json({ error: "Invalid ID" });
		}

		const composer = await findComposer(id);
		if (composer) {
			response.json(composer);
		} else {
			response.status(404).json({ error: "Composer not found" });
		}
	} catch (error) {
		console.error(error);
		response.status(500).json({ error: "Internal server error" });
	}
});

// PUT /composers/:id
router.put("/:id", async (request, response) => {
	//Förutsätter att vi inte sätter vårt id själva utan att det sätts automatiskt av mongoDB
	const { id } = request.params;
	if (!mongoose.isValidObjectId(id)) {
		return response.status(400).json({ error: "Invalid ID" });
	}
	const updatedComposer = await updateComposer(id, request.body);
	response.json(updatedComposer);
});

// DELETE /composers/:id
router.delete("/:id", async (request, response) => {
	const { id } = request.params;
	if (!mongoose.isValidObjectId(id)) {
		return response.status(400).json({ error: "Invalid ID" });
	}
	await deleteComposer(id);
	response.status(204).end();
});

module.exports = router;
