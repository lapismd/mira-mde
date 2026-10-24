FROM node:22.22.0-bookworm@sha256:20a424ecd1d2064a44e12fe287bf3dae443aab31dc5e0c0cb6c74bef9c78911c AS node
FROM mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e AS ui
COPY --from=node /usr/local/ /usr/local/
ENV DEBIAN_FRONTEND=noninteractive PNPM_HOME=/opt/pnpm PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PATH=/opt/tools:/opt/pnpm:$PATH
RUN apt-get update && apt-get install -y --no-install-recommends git python3 curl ca-certificates lsof && rm -rf /var/lib/apt/lists/* && npm install -g pnpm@10.32.1
COPY install-tools.mjs /opt/install-tools.mjs
RUN node /opt/install-tools.mjs
RUN git config --system user.name 'LapisMD validation' && git config --system user.email 'validation@localhost' && git config --system --add safe.directory '*'
RUN mkdir -p /input /results /work/mira
WORKDIR /work/mira

