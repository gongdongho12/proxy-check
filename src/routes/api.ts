import { Router } from "express";
// @ts-ignore
import proxy_check from "proxy-check";
import dns from "dns";
const router = Router();

function getDnsServers() {
	return dns.getServers();
}

router.get("/check_proxy", async (req, res) => {
	const { ports = ["8080", "8081"] }: any = req.query;

	console.log("req.query", req.query);
	console.log("ports", ports);

	const mobileProxy = getDnsServers();
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
	const availableProxyPorts: string[] = [];
	await proxies.reduce((prev, proxy) => {
		return prev.then(() =>
			proxy_check(proxy)
				.then(() => {
					availableProxyPorts.push(proxy.port);
				})
				.catch((e: any) => {
					console.error(`port: ${proxy.port}`, e);
				})
		);
	}, Promise.resolve());
	res.send({
		availableProxyPorts,
	});
});

export default router;
