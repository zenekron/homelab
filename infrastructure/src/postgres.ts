import {
	PersistentVolumeClaim,
	Secret,
	Service,
} from "@pulumi/kubernetes/core/v1";
import {
	ComponentResource,
	ComponentResourceOptions,
	Input,
	Output,
	interpolate,
} from "@pulumi/pulumi";
import { RandomPassword } from "@pulumi/random";
import { KubernetesCommonLabels } from "./util";
import { Deployment } from "@pulumi/kubernetes/apps/v1";

export interface PostgresArgs {
	namespace?: Input<string>;
	labels?: Record<string, Input<string>>;

	mode: "single-instance";
	version?: Input<string>;
	username?: Input<string>;
	password?: Input<string>;
	database?: Input<string>;
}

export class Postgres extends ComponentResource {
	// args
	public readonly namespace: Input<string>;
	public readonly labels: Record<string, Input<string>>;

	public readonly version: Input<string>;
	public readonly username: Input<string>;
	public readonly password: Input<string>;
	public readonly database: Input<string>;

	// resources
	public readonly deployment: Deployment;
	public readonly pvc: PersistentVolumeClaim;
	public readonly secret: Secret;
	public readonly service: Service;

	// other
	public readonly connectionUrl: Output<string>;

	constructor(
		name: string,
		args: PostgresArgs,
		opts?: ComponentResourceOptions,
	) {
		super("Postgres", name, undefined, opts);

		this.namespace = args.namespace ?? "default";
		this.version = args.version ?? "latest";
		this.username = args.username ?? "postgres";
		this.password =
			args.password ??
			new RandomPassword(
				`${name}-password`,
				{ length: 16, special: false },
				{ parent: this },
			).result;
		this.database = args.database ?? this.username;
		this.labels = {
			...(args.labels ?? {}),
			...({
				"app.kubernetes.io/name": "postgres",
				"app.kubernetes.io/version": this.version,
				"app.kubernetes.io/component": "database",
				"app.kubernetes.io/managed-by": "pulumi",
			} satisfies {
				[k in keyof KubernetesCommonLabels]?: Input<KubernetesCommonLabels[k]>;
			}),
		};

		const secret = new Secret(
			`${name}-secret`,
			{
				metadata: {
					name: "postgres-credentials",
					namespace: this.namespace,
					labels: this.labels,
				},

				data: {
					POSTGRES_USER: this.username,
					POSTGRES_PASSWORD: this.password,
				},
			},
			{ parent: this },
		);

		const pvc = new PersistentVolumeClaim(
			`${name}-pvc`,
			{
				metadata: {
					name: "postgres-data",
					namespace: this.namespace,
					labels: this.labels,

					annotations: {
						// NOTE: when the "storageClass.VolumeBindingMode" is set to
						// "WaitForFirstConsumer", the PVC will be stuck in the "Pending"
						// status waiting for some other resource to consume the PVC, but
						// pulumi will not create said resource until the status is "Ready",
						// effectively causing a hang.
						"pulumi.com/skipAwait": "true",
					},
				},

				spec: {
					accessModes: ["ReadWriteOnce"],

					resources: {
						requests: {
							storage: "4Gi",
						},
					},
				},
			},
			{ parent: this },
		);

		const dataVolumeName = "postgres-data";
		const port = { name: "postgres", protocol: "TCP", port: 5432 };

		const deployment = new Deployment(
			`${name}-deployment`,
			{
				metadata: {
					name: "postgres",
					namespace: this.namespace,
					labels: this.labels,
				},

				spec: {
					replicas: 1,

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
									name: "postgres",
									image: interpolate`postgres:${this.version}`,

									env: [
										{
											name: "POSTGRES_DB",
											value: this.database,
										},
										// TODO: POSTGRES_INITDB_ARGS
										// TODO: POSTGRES_INITDB_WALDIR
										// TODO: POSTGRES_HOST_AUTH_METHOD
										// TODO: PGDATA
									],

									envFrom: [
										{
											secretRef: {
												name: secret.metadata.name,
												optional: false,
											},
										},
									],

									ports: [
										{
											name: port.name,
											protocol: port.protocol,
											containerPort: port.port,
										},
									],

									volumeMounts: [
										{
											name: dataVolumeName,
											mountPath: "/var/lib/postgresql/data",
										},
									],

									// restartPolicy: "Always",
								},
							],

							volumes: [
								{
									name: dataVolumeName,
									persistentVolumeClaim: {
										claimName: pvc.metadata.name,
									},
								},
							],
						},
					},
				},
			},
			{ parent: this },
		);

		const service = new Service(
			`${name}-service`,
			{
				metadata: {
					name: "postgres",
					namespace: this.namespace,
					labels: this.labels,
				},

				spec: {
					type: "ClusterIP",
					selector: this.labels,

					ports: [
						{
							name: port.name,
							protocol: port.protocol,
							port: port.port,
							// nodePort: port.port,
						},
					],
				},
			},
			{ parent: this },
		);

		this.deployment = deployment;
		this.pvc = pvc;
		this.secret = secret;
		this.service = service;

		this.connectionUrl = interpolate`postgresql://${this.username}:${this.password}@${service.metadata.name}.${service.metadata.namespace}.svc.cluster.local:${port.port}/${this.database}`;
	}
}
