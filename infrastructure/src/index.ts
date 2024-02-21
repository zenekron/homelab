import { Namespace } from "@pulumi/kubernetes/core/v1";
import { KubernetesCommonLabels } from "./util";
import { Postgres } from "./postgres";
import { Democracy } from "./democracy";
import { Config } from "@pulumi/pulumi";

const cfg = new Config();
const discordToken = cfg.requireSecret("democracy-discord-token");

const democracyLabels: Partial<KubernetesCommonLabels> = {
	"app.kubernetes.io/part-of": "democracy",
	"app.kubernetes.io/managed-by": "pulumi",
};

const democracyNamespace = new Namespace("democracy-namespace", {
	metadata: {
		name: "democracy",
		labels: democracyLabels,
	},
});

const democracyPostgres = new Postgres("democracy", {
	mode: "single-instance",
	version: "15.3",

	namespace: democracyNamespace.metadata.name,
	labels: democracyLabels,
});

const democracyBot = new Democracy("democracy", {
	databaseUrl: democracyPostgres.connectionUrl,
	discordToken,
	version: "0.2.2",

	namespace: democracyNamespace.metadata.name,
	labels: democracyLabels,
});

democracyBot;
