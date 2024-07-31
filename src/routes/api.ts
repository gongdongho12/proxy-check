import { Router } from "express";
// @ts-ignore
import proxy_check from "proxy-check";
import shellExec from "shell-exec";
import dns from "dns";
import { networkInterfaces } from "os";

const os = require("os");
const { exec } = require("child_process");

function getNetworkInterfaces() {
	const interfaces = os.networkInterfaces();
	return Object.keys(interfaces)
		.map((name) => {
			const iface = interfaces[name].find(
				(details: any) => details.family === "IPv4" && !details.internal
			);
			return iface ? { name, address: iface.address } : null;
		})
		.filter(Boolean);
}

function getGateway(interfaceName: string): Promise<string> {
	const command =
		process.platform === "win32"
			? `netstat -rn | findstr ${interfaceName}`
			: `ip route | grep ${interfaceName} | grep default`;

	return new Promise((resolve, reject) => {
		exec(command, (err: any, stdout: string, stderr: any) => {
			if (err || stderr) {
				console.log("stderr", stderr);
				console.log("err", err);
				reject(err || stderr);
			}

			const gateway =
				process.platform === "win32"
					? stdout.split(/\s+/)[2] // Windows
					: stdout.split(" ")[2]; // Unix-based
			resolve(gateway);
		});
	});
}

const router = Router();

function getDnsServers() {
	const allDns = dns.getServers();
	console.log("allDns", allDns);
	return allDns.filter(
		(v) =>
			!(
				v.startsWith("168.126.63.") ||
				v.startsWith("192.168.1.") ||
				v.startsWith("8.8.8.8") ||
				v.startsWith("192.168.30.")
			)
	);
}

router.get("/check_proxy", async (req, res) => {
	const { ports = ["8080", "8081"] }: any = req.query;

	console.log("req.query", req.query);
	console.log("ports", ports);

	const mobileProxy = getDnsServers();
	console.log("mobileProxy", mobileProxy);
	const proxies: { host: string; port: string }[] = [];
	mobileProxy.forEach((host) => {
		console.log("host", host);
		ports.forEach((port: string) => {
			const proxy = {
				host,
				port,
			};
			proxies.push(proxy);
		});
	});
	const availableProxyPorts = new Set<string>();
	await proxies.reduce((prev, proxy) => {
		return prev.then(() =>
			proxy_check(proxy)
				.then((r: boolean) => {
					console.log(`availableProxyPort, ${r}`, proxy.port);
					availableProxyPorts.add(proxy.port);
				})
				.catch((e: any) => {
					console.error(`port: ${proxy.port}`, e);
				})
		);
	}, Promise.resolve());
	res.send({
		availableProxyPorts: Array.from(availableProxyPorts),
	});
});

router.get("/generate_proxy", async (req, res) => {
	const { ports = ["8080", "8081"], password = undefined }: any = req.query;

	const interfaces = getNetworkInterfaces();
	const gateways = await interfaces.reduce(
		(prevPromise: Promise<any[]>, iface: any) => {
			return prevPromise.then((prev: any[]) => {
				if (!iface.name.startsWith("usb")) {
					return prev;
				}
				return getGateway(iface.name)
					.then((gateway: string) => {
						console.log(
							`Interface: ${iface.name}, IPv4: ${iface.address}, Gateway: ${gateway}`
						);
						return { ...iface, gateway } as any;
					})
					.then((gateway: any) => [...prev, gateway])
					.catch(() => prev);
			});
		},
		Promise.resolve([])
	);

	console.log("req.query", req.query);
	console.log("ports", ports);
	console.log("gateways", gateways);

	const proxies: { host: string; port: string }[] = [];
	gateways.forEach(({ gateway }) => {
		console.log("gateway", gateway);
		ports.forEach((port: string) => {
			const proxy = {
				host: gateway,
				port,
			};
			proxies.push(proxy);
		});
	});
	const availableProxyPorts = new Set<string>();
	await proxies.reduce((prev, proxy) => {
		return prev.then(() =>
			proxy_check(proxy)
				.then((r: boolean) => {
					console.log(`availableProxyPort, ${r}`, proxy.port);
					availableProxyPorts.add(proxy.port);
					if (password) {
						const stopCommand = `sudo docker stop mitmproxy${proxy.port}`;
						const deleteCommand = `sudo docker rm mitmproxy${proxy.port}`;
						const runCommand = `sudo docker run -it --cpus=2 -m 1024m --memory-reservation=512m --restart always -p ${proxy.port}:${proxy.port} --name mitmproxy${proxy.port} -d mitmproxy/mitmproxy:latest mitmproxy --set 	block_global=false --set listen_port=${proxy.port} --mode upstream:http://${proxy.host}:${proxy.port}`;
						console.log("stopCommand", stopCommand);
						console.log("deleteCommand", deleteCommand);
						console.log("runCommand", runCommand);
						return shellExec(stopCommand).then(() =>
							shellExec(deleteCommand).then(() =>
								shellExec(runCommand).then((result) => {
									console.log("mitmproxy generate", result);
								})
							)
						);
					}
				})
				.catch((e: any) => {
					console.error(`port: ${proxy.port}`, e);
				})
		);
	}, Promise.resolve());
	res.send({
		availableProxyPorts: Array.from(availableProxyPorts),
	});
});

export default router;
