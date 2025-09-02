const ComposerModel = require("./models/composer");
const mongoose = require("mongoose");

const createComposer = async (composer) => {
	const newComposer = new ComposerModel(composer);
	return newComposer.save();
};

const findComposer = async (id) => {
	return ComposerModel.findById(id);
};

const findComposers = async () => {
	const composers = await ComposerModel.find().lean();
	return composers;
};

const updateComposer = async (id, composer) => {
	//New: true gör att vi får tillbaka den uppdaterade versionen av objektet
	//RunValidators: true gör att vi kör validatorerna på objektet så vi inte råkar skicka in ett nummer där det ska vara en sträng o.s.v.
	return ComposerModel.findByIdAndUpdate(id, composer, {
		new: true,
		runValidators: true,
	});
};

const deleteComposer = async (id) => {
	return ComposerModel.findByIdAndDelete(id);
};

const findComposersByBorn = async (startYear, endYear) => {
	console.log(startYear, endYear);
	return ComposerModel.find({
		born: {
			$gte: startYear,
			$lte: endYear,
		},
	});
};

// Hämta composers med filter och sortering (filter-objektet skapas just nu i APIet)
const findComposersWithFilter = async (filter, sortOptions = null) => {
	let query = ComposerModel.find(filter).lean();
	if (sortOptions) query = query.sort(sortOptions);
	return query;
};

// Lägg till ett verk till en composers noterable works ($addToSet lägger till om det inte finns redan)
const addWorkToComposer = async (id, title) => {
	return ComposerModel.findByIdAndUpdate(
		id,
		{ $addToSet: { notableWorks: title } },
		{ new: true, runValidators: true }
	).lean();
};

// Ta bort ett verk från notable works
const removeWorkFromComposer = async (id, title) => {
	return ComposerModel.findByIdAndUpdate(
		id,
		{ $pull: { notableWorks: title } }, // $pull tar bort från arraten "notabelWorks"
		{ new: true } // Returnera det uppdaterade dokumentet
	);
};

// Hämta statistik om composers
const getComposerStats = async () => {
	/*
    Aggregation är MongoDB's sätt att skapa en pipline för att hämta data.
    Vi kan använda det för att hämta data från flera dokument.
    Gruppera saker, räkna, sortera, etc.
    Lite liknande SQL GROUP BY. etc.
    */

	// Vi får tillbaka en array med resultatet från aggregationen (i det här fallet en array med ett objekt)
	const [totals] = await ComposerModel.aggregate([
		{
			// Vi kan använda $facet för att köra flera aggregation pipelines inom en enda steg.
			$facet: {
				// Första piplinen: Räkna totala antalet composers
				count: [{ $count: "total" }],

				// Andra piplinen: Beräkna medelåldern för alla composers
				// Grupperar alla dokument (_id: null) och använder $avg operator på "born" fältet
				avgBorn: [{ $group: { _id: null, avgBorn: { $avg: "$born" } } }],

				// Tredje piplinen: Räkna antalet composers per era
				byEra: [
					// Grupperar efter era fältet och räknar antalet dokument
					{ $group: { _id: "$era", count: { $sum: 1 } } },
					// Sorterar resultatet efter count i fallande ordning (-1)
					{ $sort: { count: -1 } },
				],
			},
		},
	]);

	//Vi får tillbaka ett objekt som ser ut såhär:
	/*
    {
        count: [ { total: 10 } ],
        avgBorn: [ { avgBorn: 1750 } ],
        byEra: [ { _id: 'Baroque', count: 10 }, { _id: 'Classical', count: 10 } ]
    }
    */

	return {
		total: totals.count[0]?.total || 0,
		avgBorn: totals.avgBorn[0]?.avgBorn || null,
		byEra: totals.byEra.map((e) => ({ era: e._id, count: e.count })),
	};
};

// Hämta en composer med sina verk (använder aggregation)
const findComposerWithWorks = async (id) => {
	// Kör en aggregation pipeline på "composers" collection via Mongoose model
	const [doc] = await ComposerModel.aggregate([
		// Steg 1: Filtrera ned till exakt den composer med detta _id
		// createFromHexString(id) konverterar hex stringen till en real ObjectId (types måste matcha för att jämföra)
		{ $match: { _id: mongoose.Types.ObjectId.createFromHexString(id) } },

		// Steg 2: Vi gör en left-outer-join av "works" collection på composer
		{
			$lookup: {
				from: "works", // namnet på MongoDB collectionen att joina (i vårt fall "works")
				localField: "_id", // fältet i composer documents (i vårt fall "_id")
				foreignField: "composerId", // fältet i "works" documents som refererar till composer _id (i vårt fall "composerId")
				as: "works", // namnet på arrayfältet att lagra matched works i (i vårt fall "works")
			},
		},
	]);

	// Vi får tillbaka ett objekt som ser ut såhär (ungefär):
	/*
    {
        _id: "672381238123812381238123",
        name: "Composer",
        works: [ { title: "Work", year: 1999 } ]
    }
    */

	//Det här är ett smidigt sätt att hämta information från flera collections i en enda query.
	//Istället för att först hämta en composer och sedan hämta dess verk så hämtar vi allt i en enda query.
	return doc;
};

module.exports = {
	findComposer,
	findComposers,
	createComposer,
	updateComposer,
	deleteComposer,
	findComposersByBorn,
	findComposersWithFilter,
	addWorkToComposer,
	removeWorkFromComposer,
	getComposerStats,
	findComposerWithWorks,
};
