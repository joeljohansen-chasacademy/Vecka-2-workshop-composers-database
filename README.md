# Mongoose Workshop

Ni ska nu bygga ett REST-API med hjälp av ExpressJS, MongoDB och Mongoose.

## Prerequisites

Innan ni startar behöver ni:

- En MongoDB-instans (t.ex. via **MongoDB Atlas**)
- Node.js installerat
- VS Code

## Stackens komponenter

Ni använder er av följande komponenter:

- **Node.js** är en runtime som kör er kod
- **MongoDB** är databasen där ni lagrar data som postas in via API\:et
- **Mongoose** är ett npm-paket ni använder för att ansluta och skicka frågor till databasen

## Sätta upp miljön

1. Skapa en katalog och öppna den med VS Code, starta terminalen och skriv:

   ```bash
   npm init -y
   //eller npm init och sen stega igenom guiden
   ```

2. Installera **nodemon**:

   ```bash
   npm i nodemon --save-dev
   ```

## Sätta upp Express.js

1. Installera express

   ```bash
   npm i express
   ```

2. Skapa `index.js` och lägg in grundkoden för en express-server:

   ```js
   const express = require("express");

   const app = express();
   app.use(express.json());

   app.get("/", (req, res) => {
   	res.send("Hello World!");
   });

   const port = 3000;
   app.listen(port, () => {
   	console.log(`Server running on port ${port}`);
   });
   ```

3. Lägg till start-script i `package.json`

   ```json
   "dev": "nodemon index.js"
   ```

4. Testa starta appen och surfa till [http://localhost:3000](http://localhost:3000)

   ```bash
   npm run dev
   ```

## Skapa en router

Vi ska nu lägga till CRUD-operationer för entiteten **composer**. För att separera logiken i appen skapar vi en egen router för composers.

1. Skapa `routes/composers.js`

   ```js
   const express = require("express");
   const router = express.Router();

   // GET /composers
   router.get("/", async (req, res) => {
   	const composers = await findComposers(); // implementeras senare
   	res.json(composers);
   });

   module.exports = router;
   ```

2. Importera routers i `index.js` och registrera i express-appen

   ```js
   const composersRouter = require("./routes/composers");

   // ...
   app.use("/composers", composersRouter);
   ```

## Sätta upp anslutning till MongoDB via Mongoose

1. Installera mongoose

   ```bash
   npm i mongoose
   ```

2. Skapa en anslutning i `index.js`. Använd gärna `.env` för att inte checka in användaruppgifter till git.

   ```js
   const express = require("express");
   const mongoose = require("mongoose");
   require("dotenv").config();

   const app = express();
   app.use(express.json());

   const composersRouter = require("./routes/composers");
   app.use("/composers", composersRouter);

   const port = process.env.PORT || 3000;

   async function start() {
   	try {
   		await mongoose.connect(process.env.MONGODB_URI);
   		console.log("✅ Connected to MongoDB");
   		app.listen(port, () => {
   			console.log(`Server running on http://localhost:${port}`);
   		});
   	} catch (err) {
   		console.error("MongoDB connection error:", err.message);
   		process.exit(1);
   	}
   }

   start();
   ```

   Exempel på `.env`:

   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/composersDatabase?retryWrites=true&w=majority
   ```

## Skapa schema och model för composer

1. Lägg till en mapp `db` som innehåller all databas-logik
2. I `db`, lägg till en mapp `models` som innehåller modeller för alla collections
3. Skapa `db/models/composer.js` och lägg in schema och model:

   ```js
   const mongoose = require("mongoose");

   const composerSchema = new mongoose.Schema(
   	{
   		name: { type: String, required: true, trim: true, unique: true },
   		born: { type: Number, required: true },
   		death: { type: Number }, // valfri
   		era: { type: String, required: true, trim: true },
   		bio: { type: String, required: true },
   		notableWorks: { type: [String], default: [] },
   	},
   	{ timestamps: true }
   );

   const ComposerModel = mongoose.model("Composer", composerSchema);
   module.exports = ComposerModel;
   ```

## Skapa en `createComposer`-funktion

Nu när vi har modellen är vi redo att skapa funktionen som lägger till en composer i databasen.

1. Skapa `db/composerCrud.js` och lägg till en `createComposer`-funktion som använder Composer-modellen:

   ```js
   const ComposerModel = require("./models/composer");

   const createComposer = async (composer) => {
   	const newComposer = new ComposerModel(composer);
   	return newComposer.save();
   };

   const findComposers = async () => ComposerModel.find().lean();

   module.exports = { createComposer, findComposers };
   ```

2. Importera och använd `findComposers` i `routes/composers.js`.

## Skapa en route för `POST /composers`

1. I `routes/composers.js` lägger vi till en ny route för POST som anropar `createComposer` från `db/composerCrud.js` och returnerar det skapade dokumentet:

   ```js
   const express = require("express");
   const { createComposer, findComposers } = require("../db/composerCrud");

   const router = express.Router();

   // POST /composers
   router.post("/", async (req, res) => {
   	try {
   		const createdComposer = await createComposer(req.body);
   		res.status(201).json(createdComposer);
   	} catch (err) {
   		if (err.code === 11000) {
   			return res.status(409).json({ error: "Name must be unique" });
   		}
   		res
   			.status(400)
   			.json({ error: "Validation error", details: err.message });
   	}
   });

   module.exports = router;
   ```

## Testa koden

Använd en REST-klient (t.ex. Thunder Client eller Postman) för att testa POST-endpointen.
Se `list_of_composers.json` för mer exempeldata att använda.

> `POST /composers`

```json
{
	"name": "Lili Boulanger",
	"born": 1893,
	"death": 1918,
	"era": "20th century",
	"bio": "Lili Boulanger (1893–1918) was a French composer...",
	"notableWorks": [
		"Faust et Hélène (1913)",
		"Psalm 24 (1916)",
		"D'un matin de printemps (1918)",
		"Pie Jesu (1918)"
	]
}
```

## Fler endpoints

Nu har vi gått igenom hur man sätter upp alla komponenter och skapar en POST-endpoint. Skapa nu ytterligare endpoints:

- `GET /composers`
- `GET /composers/:id`
- `PUT /composers/:id`
- `DELETE /composers/:id`

Ta hjälp av föreläsningsanteckningarna och Mongoose-dokumentationen för queries ([https://mongoosejs.com/docs/queries.html](https://mongoosejs.com/docs/queries.html)).

## Refaktorering – förslag

När ni gjort endpoints för alla CRUD-operationer och koden fungerar är det dags för förbättringar och refaktorisering. Förslag:

- Bryt ut konfigurerbara värden (t.ex. Connection URI) i en `.env`-fil och läs in med `dotenv`
- Lägg till validering av input-data
- Se till att `name` är unikt
- Stöd för filtrering på name, era, born (exakt), intervall på bornAfter/bornBefore och sortering via ?sort= (ex. sort=born eller sort=-born).
- Fundera på vad som är rätt väg att gå för `notableWorks` (embedded vs referens)
- Se till att rätt statuskoder returneras beroende på metod och utfall
- (Frivilligt) Lägg till paginering på `GET /composers` via `?page=&limit=`

## Fler uppgifter

- Lägg till en route som enbart pushar in ett verk i en kompositörs notableWorks – men utan dubletter. Använd $addToSet.
- Lägg till en route för att ta bort ett verk i en kompositörs notableWorks
- Skapa GET /composers/stats som returnerar: antal kompositörer, genomsnittligt födelseår, fördelning per era
- Skapa en ny collection works och koppla verk → kompositör. Då får ny skriva ett nytt schema, nya rutter för att skapa/leta verk, om man hinner - spana in: $lookup/två-stegs-hämtning.
- Förslag på parametrar för verk (om ni inte vet type etc så får ni gissa :)
  - title (String, required) //titel, finns i exempeldatan
  - year (Number, optional) //vilket år det skrevs (finns i exempeldatan)
  - type (String, optional; t.ex. “orchestral”, “cantata”)
  - composerId (ObjectId → Composer, required) //referensen till kompositören
  - duration (Number, optional) //ungefärlig duration
  - instrumentation (String, optional) //typ orkester, stråkkvartett, elektronik
  - notes (String, optional) //information om verket

## Svårare uppgift

I ditt MongoDB-kluster i [Atlas](https://cloud.mongodb.com) kan det finnas en testdatabas som heter `sample_mflix` med en collection `movies`. `movies` har två underdokument `imdb` och `tomatoes` som innehåller betyg.

- Skapa ett API med en endpoint som plockar ut de 100 filmer med högst betyg (IMDB eller Rotten Tomatoes)
- Skapa även en endpoint som plockar ut de 50 filmer med högst betyg i en specifik genre
- Skapa en endpoint som plockar ut de 25 filmer med högst betyg för ett specifikt år
- Gör en frontend som använder dessa endpoints och visar filmernas namn och poster
- Använd paginering så att alla 100 filmer inte visas samtidigt utan 10 filmer åt gången och man får bläddra mellan sidorna
