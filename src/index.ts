import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cluster from "cluster";
import os from "os";
import { v4 } from "uuid";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptionsWhiteList, morganConfig } from "./config/config";
import { handleError, notFound } from "./middleware/errorHandler";
import baseRoutes from "./routes";
import process from "process";

const cpuCount = os.cpus().length;
const workerCount = cpuCount / 2;

// dotenv config
dotenv.config();
const instanceId = v4();

const PRIMARY_ID = "PRIMARY_ID";

const expressGenerator = (useCluster: boolean) => {
	// express app
	const app = express();
	app.use(express.static('public'));

	// Basic middlewares
	app.use(morgan(morganConfig));
	app.use(helmet());
	// app.use(cors(corsOptionsWhiteList));
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));

	if (useCluster) {
		const worker_id = cluster.worker.id;
		let primary_id = "";
		// Request master's id to master.
		process.send({ worker_id: worker_id, cmd: PRIMARY_ID });
		process.on("message", (msg: any) => {
			if (msg.cmd === PRIMARY_ID) {
				primary_id = msg.primary_id;
			}
		});
		app.get("/where", (req, res) => {
			res.send(`Running server: ${primary_id} \n Running worker: ${worker_id}`);
		});
	}

	// base routes
	app.use("/", baseRoutes);

	// Error handler
	app.use(notFound);
	app.use(handleError);

	// connection to server
	const port = process.env.PORT || 3000;

	console.log("port", port)
	app.listen(Number(port), "0.0.0.0", () => {
		console.info(`Express web server started: http://0.0.0.0:${port}`);
	});
	return app;
};

if (workerCount >= 2) {
	if (cluster.isMaster) {
		console.log(`Server ID: ${instanceId}`);
		console.log(`Number of server's CPU: ${cpuCount}`);
		console.log(`Number of workers to create: ${workerCount}`);
		console.log(`Now create total ${workerCount} workers ...`);

		// Message listener
		const workerMsgListener = (msg: any) => {
			const worker_id = msg.worker_id;
			// Send master's id.
			if (msg.cmd === PRIMARY_ID) {
				cluster.workers[worker_id].send({
					cmd: PRIMARY_ID,
					primary_id: instanceId,
				});
			}
		};
		// Create workers
		for (var i = 0; i < workerCount; i++) {
			const worker = cluster.fork();
			console.log(`Worker is created. [${i + 1}/${workerCount}]`);
			worker.on("message", workerMsgListener);
		}
		// Worker is now online.
		cluster.on("online", (worker) => {
			console.log(`Worker is now online: ${worker.process.pid}`);
		});
		// Re-create dead worker.
		cluster.on("exit", (deadWorker) => {
			console.log(`Worker is dead: ${deadWorker.process.pid}`);
			const worker = cluster.fork();
			console.log(`New worker is created.`);
			worker.on("message", workerMsgListener);
		});
	} else if (cluster.isWorker) {
		expressGenerator(true);
	}
} else {
	expressGenerator(false);
}

