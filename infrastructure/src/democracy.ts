import { Secret } from "@pulumi/kubernetes/core/v1";
import {
	ComponentResource,
	ComponentResourceOptions,
	Input,
	interpolate,
} from "@pulumi/pulumi";
import { KubernetesCommonLabels } from "./util";
import { Deployment } from "@pulumi/kubernetes/apps/v1";

export interface DemocracyArgs {
	version: Input<string>;
	databaseUrl: Input<string>;
	discordToken: Input<string>;

	namespace?: Input<string>;
	labels?: Record<string, Input<string>>;
}

export class Democracy extends ComponentResource {
	// args
	public readonly version: Input<string>;
	public readonly databaseUrl: Input<string>;
	public readonly discordToken: Input<string>;

	public readonly namespace: Input<string>;
	public readonly labels: Record<string, Input<string>>;

	// resources
	public readonly deployment: Deployment;
	public readonly secret: Secret;

	constructor(
		name: string,
		args: DemocracyArgs,
		opts?: ComponentResourceOptions,
	) {
		super("Democracy", name, undefined, opts);

		this.version = args.version;
		this.databaseUrl = args.databaseUrl;
		this.discordToken = args.discordToken;

		this.namespace = args.namespace ?? "default";
		this.labels = {
			...(args.labels ?? {}),
			...({
				"app.kubernetes.io/name": "democracy",
				"app.kubernetes.io/version": this.version,
				"app.kubernetes.io/component": "application",
				"app.kubernetes.io/managed-by": "pulumi",
			} satisfies {
				[k in keyof KubernetesCommonLabels]?: Input<KubernetesCommonLabels[k]>;
			}),
		};

		const secret = new Secret(
			`${name}-secret`,
			{
				metadata: {
					name: "democracy",
					namespace: this.namespace,
					labels: this.labels,
				},

				stringData: {
					DATABASE_URL: this.databaseUrl,
					DISCORD_TOKEN: this.discordToken,
				},
			},
			{ parent: this },
		);

		const deployment = new Deployment(
			`${name}-deployment`,
			{
				metadata: {
					name: "democracy",
					namespace: this.namespace,
					labels: this.labels,
				},

				spec: {
					// the bot does not currently support multiple instances running
					replicas: 1,

					strategy: {
						type: "Recreate",
					},

					selector: {
						matchLabels: this.labels,
					},

					template: {
						metadata: {
							labels: this.labels,
						},

						spec: {
							containers: [
								{
									name: "democracy",
									image: interpolate`ghcr.io/zenekron/democracy:${this.version}`,
									imagePullPolicy: "Always",

									env: [
										{
											name: "RUST_LOG",
											value: "info,democracy=debug",
										},
									],

									envFrom: [
										{
											prefix: "DEMOCRACY_",
											secretRef: {
												name: secret.metadata.name,
												optional: false,
											},
										},
									],
								},
							],

							restartPolicy: "Always",
						},
					},
				},
			},
			{ parent: this },
		);

		this.deployment = deployment;
		this.secret = secret;
	}
}
