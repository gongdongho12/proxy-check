import { Router } from "express";
// @ts-ignore
import proxy_check from "proxy-check";
import dns from "dns";
const router = Router();

function getDnsServers() {
	return dns
		.getServers()
		.filter(
			(v) => !(v.startsWith("168.126.63.") || v.startsWith("192.168.1."))
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

export default router;
