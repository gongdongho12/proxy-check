import { Router } from "express";
// @ts-ignore
import proxy_check from "proxy-check";
import shellExec from "shell-exec";
import dns from "dns";
const router = Router();

function getDnsServers() {
	return dns
		.getServers()
		.filter(
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
	const { ports = ["8080", "8081"], password = undefined }: any = req.query;

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
					if (password) {
						const command = `echo "${password}" | sudo -S "docker run -it --cpus=2 -m 1024m --memory-reservation=1024m --restart always -p ${proxy.port}:${proxy.port} --name mitmproxy${proxy.port} -d mitmproxy/mitmproxy:latest mitmproxy --set 	block_global=false --set listen_port=${proxy.port} --mode upstream:http://${proxy.host}:${proxy.port}"`;
						return shellExec(command).then(() => {
							console.log("mitmproxy run");
						});
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
