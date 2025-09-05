const express = require("express");
const mongoose = require("mongoose");

mongoose.connect(
	"YOUR_KEY_HERE"
);

const app = express();
app.use(express.json());

const composersRouter = require("./routes/composers");
app.use("/composers", composersRouter);

app.get("/", (request, response) => {
	response.send("Hello World!");
});

const port = 3000;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
