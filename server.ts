import type { Express } from "express";
import * as p from "path";
import * as fs from "fs";
import express from "express";
import connectDB from "./config/db";
import { config } from "dotenv";
import { flow } from "fp-ts/lib/function";
import { map } from "fp-ts/lib/Array";
config();

const PORT = process.env.PORT;

// Connect Database
connectDB();
const app = express();

// Init Middleware
app.use(express.json());

// Define Routes

// generate string[] of all listed files within provided route;
const getRoutes = (path: string): string[] => fs.readdirSync(path);

// remove extension from file
const removeExt = (file: string): string => file.replace(/\.\w+$/gi, "");

// get's routes and remove's extensions
const getRouteNames = flow(getRoutes, map(removeExt));

// combines two paths
const combinePath = (a: string, b: string) => p.join(a, b);

// receives string[], loops through and adds route to app
const loopRoutes = (app: Express, prefix: string, path: string) =>
  map((name: string) =>
    app.use(combinePath(prefix, name), require(p.join(__dirname, path, name)))
  );

const curriedLoopRoutes = loopRoutes(app, "/api", "./routes/api");
const genRoutes = flow(getRouteNames, curriedLoopRoutes);

// generate routes from path "./routes/api"
genRoutes("./routes/api");

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
