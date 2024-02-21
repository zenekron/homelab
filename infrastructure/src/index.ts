import { Namespace } from "@pulumi/kubernetes/core/v1";
import { KubernetesCommonLabels } from "./util";
import { Postgres } from "./postgres";

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
	namespace: democracyNamespace.metadata.name,
	labels: democracyLabels,

	mode: "single-instance",
	version: "15.3",
});

democracyPostgres;
