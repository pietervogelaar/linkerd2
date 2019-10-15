# Linkerd2 Development Guide

:balloon: Welcome to the Linkerd2 development guide! :wave:

This document will help you build and run Linkerd2 from source. More information
about testing from source can be found in the [TEST.md](TEST.md) guide.

## Table of contents

- [Repo Layout](#repo-layout)
  - [Control Plane (Go/React)](#control-plane-goreact)
  - [Data Plane (Rust)](#data-plane-rust)
- [Components](#components)
- [Development configurations](#development-configurations)
  - [Tilt](#tilt)
  - [Comprehensive](#comprehensive)
  - [Go](#go)
  - [Web](#web)
  - [Rust](#rust)
- [Dependencies](#dependencies)
  - [Updating protobuf dependencies](#updating-protobuf-dependencies)
  - [Updating Docker dependencies](#updating-docker-dependencies)
  - [Updating ServiceProfile generated code](#updating-serviceprofile-generated-code)
- [Helm Chart](#helm-chart)
- [Build Architecture](#build-architecture)
- [Generating CLI docs](#generating-cli-docs)

## Repo layout

Linkerd2 is primarily written in Rust, Go, and React. At its core is a
high-performance data plane written in Rust. The control plane components are
written in Go. The dashboard UI is a React application.

### Control Plane (Go/React)

- [`cli`](cli): Command-line `linkerd` utility, view and drive the control
  plane.
- [`controller`](controller)
  - [`destination`](controller/api/destination): Accepts requests from `proxy`
    instances and serves service discovery information.
  - [`public-api`](controller/api/public): Accepts requests from API
    clients such as `cli` and `web`, provides access to and control of the
    Linkerd2 service mesh.
  - [`tap`](controller/tap): Provides a live pipeline of requests.
- [`web`](web): Provides a UI dashboard to view and drive the control plane.
  This component is written in Go and React.

### Data Plane (Rust)

- [`linkerd2-proxy`](https://github.com/linkerd/linkerd2-proxy): Rust source
  code for the proxy lives in the linkerd2-proxy repo.
- [`linkerd2-proxy-api`](https://github.com/linkerd/linkerd2-proxy-api): Protobuf
  definitions for the data plane APIs live in the linkerd2-proxy-api repo.

## Components

![Linkerd2 Components](https://g.gravizo.com/source/svg/linkerd2_components?https%3A%2F%2Fraw.githubusercontent.com%2Flinkerd%2Flinkerd2%2Fmaster%2FBUILD.md)

<details>
<summary></summary>
linkerd2_components
  digraph G {
    rankdir=LR;

    node [style=filled, shape=rect];

    "cli" [color=lightblue];
    "destination" [color=lightblue];
    "public-api" [color=lightblue];
    "tap" [color=lightblue];
    "web" [color=lightblue];

    "proxy" [color=orange];

    "cli" -> "public-api";

    "web" -> "public-api";
    "web" -> "grafana";

    "public-api" -> "tap";
    "public-api" -> "kubernetes api";
    "public-api" -> "prometheus";

    "tap" -> "kubernetes api";
    "tap" -> "proxy";

    "proxy" -> "destination";

    "destination" -> "kubernetes api";

    "grafana" -> "prometheus";
    "prometheus" -> "kubernetes api";
    "prometheus" -> "proxy";
  }
linkerd2_components
</details>

## Development configurations

Depending on use case, there are several configurations with which to develop
and run Linkerd2:

- [Tilt](#tilt): Use [Tilt](https://docs.tilt.dev/welcome_to_tilt.html) to
  synchronize local changes to your development cluster. Suitable for most
  contributors.
- [Comprehensive](#comprehensive): Integrated configuration using Minikube, most
  closely matches release.
- [Web](#web): Development of the Linkerd2 Dashboard.

### Tilt

[Tilt](https://docs.tilt.dev/welcome_to_tilt.html) automatically builds and
deploys changes to the Linkerd2 components to your development cluster.

To get started, following the instructions [here](https://docs.tilt.dev/install.html)
to install Tilt.

The `tilt_options.json` provides some options that you may want to alter to
suit your workflow:

- `allow_k8s_context`: (for remote cluster) Change this to the name of the k8s
   context
- `default_registry`: (for remote cluster) Change this to the full name of your
  remote registry
- `linkerd_install_opts`: Use this to specify additional installation options.
   E.g., `--ignore-cluster --ha`. Note that the options are space-delimited
- `proxy_version`: Change this to the latest edge release
- `trigger_mode`: When default to `TRIGGER_MODE_MANUAL`, Tilt will only perform
  manual rebuild, as triggered from the dashboard. See the
  [Trigger Mode](#trigger-mode) section below

When ready, run:
```bash
tilt up
```

Tilt will build the CLI and all the Linkerd component Docker images, sets up
watches on your files, and launches the Tilt dashboard.

Depending on which files you edit, Tilt will selectively build only the
relevant components. The following table summarizes Tilt's watch behavior,
where changes to any of the specified folders will trigger a rebuild
of the associated component:

Component      | Folders             | Remark
-------------- | ------------------- | ------
CLI            | `cli`               |
controller     | `controller`, `pkg` |
destination    | `controller`, `pkg` |
heartbeat      | `controller`, `pkg` |
identity       | `controller`, `pkg` |
proxy-injector | `controller`, `pkg` |
sp-validator   | `controller`, `pkg` |
tap            | `controller`, `pkg` |
grafana        | `grafana`           |
web            | `web`               |
Helm templates | `charts`            | Use `bin/helm-build` to lint the templates and dependencies
protobuf       | `proto`             | Use `bin/protoc-go.sh` to build and generate the Go source code

To remove the Linkerd2 components from your development cluster, run:

```bash
tilt down
```

##### Trigger Mode
By default, Tilt is configured to run in the `TRIGGER_MODE_MANUAL`
mode which means it won't trigger rebuild on every keystroke. When you are
satisfied with your code change, click on the button next to each component in
the Tilt dashboard to build and deploy the corresponding component.

This behaviour can be altered by changing the `trigger_mode` property in the
`tilt_options.json` file. To configure Tilt to rebuild on every change, use the
`TRIGGER_MODE_AUTO` or an empty string value.

##### Live Updates
Tilt performs live updates on the following containers, without rebuilding
the Docker images:

- `grafana` - Changes to any JSON files in the `grafana/dashboard` folder will
  be copied into the `grafana` container
- `web` - Coming soon

##### Remote Clusters
If the feature you are working on require testing to be done on remote clusters,
apply the following changes to Tilt, so that you don't have to retag the
Linkerd2 component images:

- In the Tiltfile, uncomment the line that says
  `default_registry(settings.get("default_registry"))`
- In the `tilt_options.json` file, update the:
  - `allow_k8s_contexts`: the former is the name of your remote cluster k8s
    context
  - `default_registry`: the full name of your remote registry where Tilt can
    push images to

##### Support
To get help with unfamilier build or runtime errors, feel free to share your
logs via Tilt's `Share Snapshot` feature on the Linkerd
[#contributor](https://linkerd.slack.com/messages/CMS5ZD60Y) Slack channel.

Note that the URL generated by Tilt is public, so ensures that your logs are
stripped of sensitive information.

### Comprehensive

This configuration builds all Linkerd2 components in Docker images, and deploys
them onto Minikube. This setup most closely parallels our recommended production
installation, documented at https://linkerd.io/2/getting-started/.

These commands assume a working
[Minikube](https://github.com/kubernetes/minikube) environment.

```bash
# build all docker images, using minikube as our docker repo
DOCKER_TRACE=1 bin/mkube bin/docker-build

# install linkerd
bin/linkerd install | kubectl apply -f -

# verify cli and server versions
bin/linkerd version

# validate installation
kubectl --namespace=linkerd get all
bin/linkerd check --expected-version $(bin/root-tag)

# view linkerd dashboard
bin/linkerd dashboard

# install the demo app
curl https://run.linkerd.io/emojivoto.yml | bin/linkerd inject - | kubectl apply -f -

# view demo app
minikube -n emojivoto service web-svc

# view details per deployment
bin/linkerd -n emojivoto stat deployments

# view a live pipeline of requests
bin/linkerd -n emojivoto tap deploy voting
```

### Go

#### Go modules and dependencies

This repo supports [Go Modules](https://github.com/golang/go/wiki/Modules), and
is intended to be cloned outside the `GOPATH`, where Go Modules support is
enabled by default in Go 1.11.

If you are using this repo from within the `GOPATH`, activate module support
with:

```bash
export GO111MODULE=on
```

#### A note about Go run

Our instructions use a [`bin/go-run`](bin/go-run) script in lieu `go run`.
This is a convenience script that leverages caching via `go build` to make your
build/run/debug loop faster.

In general, replace commands like this:

```bash
go run cli/main.go check
```

with this:

```bash
bin/go-run cli check
```

That is equivalent to running `linkerd check` using the code on your branch.

#### Building the CLI for development

When Linkerd2's CLI is built using `bin/docker-build` it always creates binaries
for all three platforms. For local development and a faster edit-build-test
cycle you might want to avoid that. For those situations you can set
`LINKERD_LOCAL_BUILD_CLI=1`, which builds the CLI using the local Go toolchain
outside of Docker.

```bash
LINKERD_LOCAL_BUILD_CLI=1 bin/docker-build
```

To build only the cli (locally):

```bash
bin/build-cli-bin
```

#### Running the control plane for development

Linkerd2's control plane is composed of several Go microservices. You can run
these components in a Kubernetes (or Minikube) cluster, or even locally.

To run an individual component locally, you can use the `go-run` command, and
pass in valid Kubernetes credentials via the `-kubeconfig` flag. For instance,
to run the destination service locally, run:

```bash
bin/go-run controller/cmd destination -kubeconfig ~/.kube/config -log-level debug
```

You can send test requests to the destination service using the
`destination-client` in the `controller/script` directory. For instance:

```bash
bin/go-run controller/script/destination-client -path hello.default.svc.cluster.local:80
```

##### Running the Tap APIService for development

```bash
openssl req -nodes -x509 -newkey rsa:4096 -keyout $HOME/key.pem -out $HOME/crt.pem -subj "/C=US"
bin/go-run controller/cmd tap --disable-common-names --tls-cert=$HOME/crt.pem --tls-key=$HOME/key.pem

curl -k https://localhost:8089/apis/tap.linkerd.io/v1alpha1
```

#### Generating CLI docs

The [documentation](https://linkerd.io/2/cli/) for the CLI
tool is partially generated from YAML. This can be generated by running the
`linkerd doc` command.

#### Updating templates

When kubernetes templates change, several test fixtures usually need to be updated (in
`cli/cmd/testdata/*.golden`). These golden files can be automatically
regenerated with the command:

```sh
go test ./cli/cmd/... --update
```

##### Pretty-printed diffs for templated text

When running `go test`, mismatched text is usually displayed as a compact
diff. If you prefer to see the full text of the mismatch with colorized
output, you can set the `LINKERD_TEST_PRETTY_DIFF` environment variable or
run `go test ./cli/cmd/... --pretty-diff`.

### Web

This is a React app fronting a Go process. It uses webpack to bundle assets, and
postcss to transform css.

These commands assume working [Go](https://golang.org) and
[Yarn](https://yarnpkg.com) environments.

#### First time setup

1. Install [Yarn](https://yarnpkg.com) and use it to install JS dependencies:

    ```bash
    brew install yarn
    bin/web setup
    ```

2. Install Linkerd on a Kubernetes cluster.

#### Run web standalone

```bash
bin/web run
```

The web server will be running on `localhost:7777`.

#### Webpack dev server

To develop with a webpack dev server:

1. Start the development server.

    ```bash
    bin/web dev
    ```

    Note: this will start up:

    - `web` on :7777. This is the golang process that serves the dashboard.
    - `webpack-dev-server` on :8080 to manage rebuilding/reloading of the
      javascript.
    - `controller` is port-forwarded from the Kubernetes cluster via `kubectl`
      on :8085
    - `grafana` is port-forwarded from the Kubernetes cluster via `kubectl`
      on :3000

2. Go to [http://localhost:7777](http://localhost:7777) to see everything
   running.

#### Dependencies

To add a JS dependency:

```bash
cd web/app
yarn add [dep]
```

### Rust

All Rust development happens in the
[`linkerd2-proxy`](https://github.com/linkerd/linkerd2-proxy) repo.

#### Docker

The `bin/docker-build-proxy` script builds the proxy by pulling a pre-published
proxy binary:

```bash
DOCKER_TRACE=1 bin/docker-build-proxy
```

# Dependencies

### Updating protobuf dependencies
 If you make Protobuf changes, run:
 ```bash
bin/protoc-go.sh
```

### Updating Docker dependencies

The Go Docker images rely on base dependency images with
hard-coded SHA's:

`gcr.io/linkerd-io/go-deps` depends on
- [`go.mod`](go.mod)
- [`Dockerfile-go-deps`](Dockerfile-go-deps)


When Go dependencies change, run the following:

```bash
go mod tidy
bin/build-cli-bin # adds back dependencies specific to `go generate` commands
bin/update-go-deps-shas
```

### Updating ServiceProfile generated code

The [ServiceProfile client code](./controller/gen/client) is generated by
[`bin/update-codegen.sh`](bin/update-codegen.sh), which depends on
[K8s code-generator](https://github.com/kubernetes/code-generator), which does
not yet support Go Modules. To re-generate this code, check out this repo into
your `GOPATH`:

```bash
go get -u github.com/linkerd/linkerd2
cd $GOPATH/src/github.com/linkerd/linkerd2
bin/update-codegen.sh
```

## Helm chart

The Linkerd control plane chart is located in the
[`charts/linkerd2`](charts/linkerd2) folder. The [`charts/patch`](charts/patch)
chart consists of the Linkerd proxy specification, which is used by the proxy
injector to inject the proxy container. Both charts depend on the partials
subchart which can be found in the [`charts/partials`](charts/partials) folder.

During development, please use the [`bin/helm`](bin/helm) wrapper script to
invoke the Helm commands. For example,

```bash
bin/helm install charts/linkerd2
```

This ensures that you use the same Helm version as that of the Linkerd CI
system.

For general instructions on how to install the chart check out the
[docs](https://linkerd.io/2/tasks/install-helm/). You also need to supply or
generate your own certificates to use the chart, as explained
[here](https://linkerd.io/2/tasks/generate-certificates/).

### Making changes to the chart templates

Whenever you make changes to the files under
[`charts/linkerd2/templates`](charts/linkerd2/templates) or its dependency
[`charts/partials`](charts/partials), make sure to run
[`bin/helm-build`](bin/helm-build) which will refresh the dependencies and lint
the templates.

## Build Architecture

![Build Architecture](https://g.gravizo.com/source/svg/build_architecture?https%3A%2F%2Fraw.githubusercontent.com%2Flinkerd%2Flinkerd2%2Fmaster%2FBUILD.md)

<details>
<summary></summary>
build_architecture
  digraph G {
    rankdir=LR;

    "Dockerfile-base" [color=lightblue, style=filled, shape=rect];
    "Dockerfile-go-deps" [color=lightblue, style=filled, shape=rect];
    "Dockerfile-proxy" [color=lightblue, style=filled, shape=rect];
    "controller/Dockerfile" [color=lightblue, style=filled, shape=rect];
    "cli/Dockerfile-bin" [color=lightblue, style=filled, shape=rect];
    "grafana/Dockerfile" [color=lightblue, style=filled, shape=rect];
    "web/Dockerfile" [color=lightblue, style=filled, shape=rect];

    "_docker.sh" -> "_log.sh";
    "_gcp.sh";
    "_log.sh";
    "_tag.sh" -> "Dockerfile-go-deps";

    "build-cli-bin" -> "_tag.sh";
    "build-cli-bin" -> "root-tag";

    "docker-build" -> "build-cli-bin";
    "docker-build" -> "docker-build-cli-bin";
    "docker-build" -> "docker-build-controller";
    "docker-build" -> "docker-build-grafana";
    "docker-build" -> "docker-build-proxy";
    "docker-build" -> "docker-build-web";

    "docker-build-base" -> "_docker.sh";
    "docker-build-base" -> "Dockerfile-base";

    "docker-build-cli-bin" -> "_docker.sh";
    "docker-build-cli-bin" -> "_tag.sh";
    "docker-build-cli-bin" -> "docker-build-base";
    "docker-build-cli-bin" -> "docker-build-go-deps";
    "docker-build-cli-bin" -> "cli/Dockerfile-bin";

    "docker-build-controller" -> "_docker.sh";
    "docker-build-controller" -> "_tag.sh";
    "docker-build-controller" -> "docker-build-base";
    "docker-build-controller" -> "docker-build-go-deps";
    "docker-build-controller" -> "controller/Dockerfile";

    "docker-build-go-deps" -> "_docker.sh";
    "docker-build-go-deps" -> "_tag.sh";
    "docker-build-go-deps" -> "Dockerfile-go-deps";

    "docker-build-grafana" -> "_docker.sh";
    "docker-build-grafana" -> "_tag.sh";
    "docker-build-grafana" -> "grafana/Dockerfile";

    "docker-build-proxy" -> "_docker.sh";
    "docker-build-proxy" -> "_tag.sh";
    "docker-build-proxy" -> "Dockerfile-proxy";

    "docker-build-web" -> "_docker.sh";
    "docker-build-web" -> "_tag.sh";
    "docker-build-web" -> "docker-build-base";
    "docker-build-web" -> "docker-build-go-deps";
    "docker-build-web" -> "web/Dockerfile";

    "docker-images" -> "_docker.sh";
    "docker-images" -> "_tag.sh";

    "docker-pull" -> "_docker.sh";

    "docker-pull-deps" -> "_docker.sh";
    "docker-pull-deps" -> "_tag.sh";

    "docker-push" -> "_docker.sh";

    "docker-push-deps" -> "_docker.sh";
    "docker-push-deps" -> "_tag.sh";

    "docker-retag-all" -> "_docker.sh";

    "go-run" -> ".gorun";
    "go-run" -> "root-tag";

    "linkerd" -> "build-cli-bin";

    "lint";

    "minikube-start-hyperv.bat";

    "mkube";

    "protoc" -> ".protoc";

    "protoc-go.sh" -> "protoc";

    "root-tag" -> "_tag.sh";

    "test-cleanup";

    "test-run";

    "workflow.yml" -> "_gcp.sh";
    "workflow.yml" -> "_tag.sh";
    "workflow.yml" -> "docker-build";
    "workflow.yml" -> "docker-push";
    "workflow.yml" -> "docker-push-deps";
    "workflow.yml" -> "docker-retag-all";
    "workflow.yml" -> "lint";

    "update-go-deps-shas" -> "_tag.sh";
    "update-go-deps-shas" -> "cli/Dockerfile-bin";
    "update-go-deps-shas" -> "controller/Dockerfile";
    "update-go-deps-shas" -> "grafana/Dockerfile";
    "update-go-deps-shas" -> "web/Dockerfile";

    "web" -> "go-run";
  }
build_architecture
</details>
