# Angry Birdman Production Deployment Requirements

The following are requirements that should be considered when developing a
deployment architecture and deployment plan for Angry Birdman:

1. The production server will be a small, single instance Amazon LightSail
   server running Amazon Linux 2023 as the operating system. The initial
   instance will have the following specs:

- 1 GB Memory
- 2 vCPUs Processing
- 40 GB SSD Storage

2. The production server will receive deployments via GitHub Actions workflow
   named "deploy-prod.yml", similar to our test server deployment defined in
   `deploy-test.yml`, but building and deploying with production options and
   settings. The deployment should trigger when a new tag is pushed to GitHub
   with the following format: `prod-*`.
3. The Angry Birdman test server has been used to this point to record real
   battle data as the software was being tested. As part of initial production
   deployment, we will need to migrate the data from the test server to the
   production server. This includes migration of the both the Angry Birdman
   database and the Keycloak database where the test users exist (there are only
   a couple of production appropriate accounts on the test server so I will just
   move these to production). This migration will only need to be done once.
   Once completed, the test and prod environments will be left to diverge.
4. Software dependencies (database, idp, etc.) should be running using Docker
   container instances on the LightSail server itself (not running external),
   similar to how they are on our test server. The AngryBirdman software itself
   can be deployed through a container, but this is not a requirement of the
   deployment. Deployment architecture for our software should be chosen based
   on its ability to support ease-of-administration and other production
   deployment requirements.
5. The production server will have a fixed IP address and will have a registered
   domain name.
6. The production server will have a real HTTPS certificate and the Angry
   Birdman application will use port 443. Requests to port 80 should lead to a
   redirect to the root path of the port 443 application.
7. On our test server, we run Keycloak on port 8000 without a certificate. In
   production, I need to run Keycloak on port 8443, and I want Keycloak to use
   HTTPS and the same cert that I use for the application running on port 443.
   This is a change from previous environments, which never had Keycloak behind
   SSL.
8. I need to obtain a free HTTPS certificate from a credible issuer. Renewal of
   the certificate should be simple and ideally fully automated.
9. It should be easy to keep any software installed on the server and the
   operating system itself up to date to ensure realiability and security.
   Automation of server updates should be provided/enabled where appropriate,
   and other server software updates should be easy to execute through server
   scripts.
10. Both the application and the keycloak databases should receive daily
    backups, retaining only 30 days of backups to preserve server storage.
    Backups older than 30 days should be deleted.
11. Only 30 days of logs from the application and its dependencies should be
    reatined by the server to conserve server storage space. Logs older than 30
    days should be deleted.
12. This server will be accessible over the internet, so it needs to be secure
    and locked down. We should follow AWS and industry best practices for
    securing the server.
13. The production server will need to allow administration through SSH in
    addition to administration through the AWS Console virtual terminal provided
    by LightSail.
