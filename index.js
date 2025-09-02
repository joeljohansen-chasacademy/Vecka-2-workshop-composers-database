const express = require("express");
const mongoose = require("mongoose");

mongoose.connect(
	"mongodb+srv://joeljohansen:WONyyy6Sv2kg6Pfj@cluster0.htjfnnq.mongodb.net/composersDatabase?retryWrites=true&w=majority&appName=Cluster0"
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
