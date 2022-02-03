# Example Bank App using RHSSO
**This project is a fork of the [IBM/example-bank](https://github.com/IBM/example-bank) project** that removes the IBM App ID and IAM components login and user authentication components, replacing them with Red Hat Single Sign-On (RHSSO). It is very much a retrofit and is a bit rough around the edges.

**The original documentation can be found here: [README-old.md]()**

## Introduction
This project is an example mobile bank app, that runs in the browser. It uses a combination of Liberty for Java, vanilla Javascript and HTML. It uses a Postgres-like database to store user transactions and account settings, while utilising RHSSO for account authentication and autherisation.

## Prerequisites

### Compilation
 - Java 11
 - Maven
 - Node.js
 - Docker or Podman

### Running
This app is designed to run in containers for each microservice (3 in total). While it may be possible to setup with Docker alone, it was created with either Kubernetes or ideally RHACM on top of OpenShift 4.x in mind. Please read [this](https://github.com/akiyamn/example-bank-rhacm) for more information or consult the [original documentation](README-old.md).

## Create image repos
When the app is deployed by OpenShift, a Deployment for each microservice is needed. OpenShift will pull these compiled containers from some sort of image repository.

While it is possible to use a free, public service such as docker.io, it is likely that OpenShift will exceed the amount of allowed pulls per day. It is recommended to use a service like quay.io or other private repository to push these images to.

Make an account with that service and create 3 new repos. One for: the mobile front end, user service and transaction service.

For the sake of this guide, export the following variable:
```bash
export IMAGE_SERVICE_URL=my-image-service/my-user
```

## Compiling

### Front-end
The front end is written in Javascript & HTML and therefore does not need to be compiled.
However they do need to be containerised for use in Openshift.

Navigate to the root directory of the project and run the command:
```bash
docker build -t $IMAGE_SERVICE_URL/transaction-service
```

Then push to your repo as follows:
```bash
docker push $IMAGE_SERVICE_URL/mobile-simulator
```

### Set Java version
**Make sure you have specifically Java 11 installed**. Either OpenJDK or Oracle's JDK should both work. Even though the project itself is written in Java 8, for some reason it will only compile properly when using Java 11. This is a bug with the upstream repo.

A way of making Maven use Java 11 is to run:
```bash
export JAVA_HOME=/path/to/your/java11
```

You can check the versions of the relevent Java components as so:
```bash
java --version
javac --version
mvn --version
```
All three should say they are using Java 11. If not, make sure it is installed and set as the default version for at least this session.

### Java compilation and containerisation

Navigate to the `bank-app-backend` directory and perform the following steps:

```bash
mvn -pl :transaction-service -am package
docker build -t $IMAGE_SERVICE_URL/transaction-service:latest transaction-service

mvn -pl :transaction-service -am package
docker build -t $IMAGE_SERVICE_URL/user-service:latest user-service
```

If you have problems in this process, go back and make sure you are using Java 11.

### Push to repos 

Push your images to those repos using a tool like `docker` as follows:

```bash
docker push $IMAGE_SERVICE_URL/user-service
docker push $IMAGE_SERVICE_URL/transaction-service
```

## Running
As described above, this app is designed to run in an OpenShift 4.x environment.

Please continue by following the guide in [this repo](https://github.com/akiyamn/example-bank-rhacm/tree/vault) which provides assets to run the app in OpenShift 4.x with RHACM. The next repo also uses External Secrets, which can be substituted for normal secrets if they are not applicable to your situation.
