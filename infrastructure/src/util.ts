export interface KubernetesCommonLabels {
	/**
	 * The name of the application.
	 * @example mysql
	 */
	"app.kubernetes.io/name": string;

	/**
	 * A unique name identifying the instance of an application.
	 * @example mysql-abcxzy
	 */
	"app.kubernetes.io/instance": string;

	/**
	 * The current version of the application (e.g., a SemVer 1.0, revision hash, etc.).
	 * @example 5.7.21
	 */
	"app.kubernetes.io/version": string;

	/**
	 * The component within the architecture.
	 * @example database
	 */
	"app.kubernetes.io/component": string;

	/**
	 * The name of a higher level application this one is part of.
	 * @example wordpress
	 */
	"app.kubernetes.io/part-of": string;

	/**
	 * The tool being used to manage the operation of an application.
	 * @example helm
	 */
	"app.kubernetes.io/managed-by": string;
}
